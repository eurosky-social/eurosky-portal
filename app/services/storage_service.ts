import logger from '@adonisjs/core/services/logger'
import type { DidString } from '@atproto/lex'
import { DateTime } from 'luxon'
import StorageBackfillJob from '#jobs/storage_backfill_job'
import * as lexicon from '#lexicons'
import Account from '#models/account'
import Blob from '#models/blob'
import type { Jsonify } from '#shared/json'
import { normalizeMimeType, mediaType } from '#shared/mime'
import { type StorageCategory, type StorageTab, isStorageCategory } from '#shared/storage'
import { pdsClient } from '#utils/pds'
import { decodeToken, encodeToken } from '#utils/token'

/**
 * Blobs to return per page.
 * Multiple of `4` so they somewhat fit the grid on a big screen.
 */
const pageSize = 48

/**
 * How long between full syncs.
 * These pick up all blob changes including removed blobs.
 */
const fullSyncAfterHours = 24

/**
 * How long a backfill may take;
 * progress is kept, no new requests are made after this.
 */
const backfillTimeout = 5 * 60 * 1000

/**
 * Concurrent `HEAD` requests per user.
 */
const headConcurrency = 10

/**
 * Max blobs per backfill;
 * next backfill picks up more.
 */
const maxBlobsPerBackfill = 1_000

/**
 * Max blobs to list and store per user.
 * Also keeps the cleanup query below SQLite’s variable limit.
 */
const maxBlobsPerUser = 5_000

/**
 * Max length of a stored MIME type;
 * just to be sure.
 */
const maxContentTypeSize = 255

/**
 * Max pages per backfill.
 * For weird responses, normal page holds 1000 CIDs.
 */
const maxPagesPerBackfill = 20

/**
 * How long an incremental sync stays fresh before another is triggered in
 * the background.
 * This picks up on added blobs.
 */
const staleAfterMinutes = 5

/**
 * Pagination cursor: the ordering key of the last blob on the previous page.
 */
interface BlobCursor {
  cid: string
  size: number
}

/**
 * Pagination snapshot.
 * Blobs are sorted by size, so new ones can land anywhere in the list;
 * pinning the highest row ID at first load hides everything synced later.
 */
interface BlobSnapshot {
  id: number
}

/**
 * Configuration.
 */
export interface GetStorageOptions {
  /**
   * Cursor from a previous page (`next`).
   */
  after?: string | undefined

  /**
   * Category or `all` (default: `all`).
   */
  category?: StorageTab | undefined

  /**
   * DID.
   */
  did: DidString

  /**
   * Snapshot from the first page.
   */
  snapshot?: string | undefined
}

/**
 * Ready.
 */
export interface GetStorageReadyResult {
  /**
   * Page of blobs in `category`.
   */
  blobs: Array<StorageBlobRow>

  /**
   * Storage use per category.
   */
  breakdown: Array<StorageBreakdownRow>

  /**
   * Tab.
   */
  category: StorageTab

  /**
   * Cursor for the next page, if there is one.
   * `null` instead of `undefined` for `JSON.stringify` with Inertia.
   */
  next: string | null

  /**
   * PDS that hosts the blobs.
   */
  pds: string

  /**
   * Snapshot to pass back when paginating;
   * `null` when there are no blobs.
   */
  snapshot: string | null

  /**
   * Kind.
   */
  state: 'ready'

  /**
   * Total blobs in `category`.
   */
  total: number
}

/**
 * Failed: never completed a full sync, or cannot resolve the PDS.
 */
export interface GetStorageFailedResult {
  /**
   * Kind.
   */
  state: 'failed'
}

/**
 * Syncing.
 */
export interface GetStorageSyncingResult {
  /**
   * Kind.
   */
  state: 'syncing'
}

/**
 * Result.
 */
export type GetStorageResult =
  GetStorageFailedResult | GetStorageReadyResult | GetStorageSyncingResult

/**
 * Blob.
 */
export interface StorageBlobRow {
  /**
   * Category.
   */
  category: StorageCategory

  /**
   * CID.
   */
  cid: string

  /**
   * MIME type when known.
   */
  mimeType: string | undefined

  /**
   * Size in bytes.
   */
  size: number
}

/**
 * Storage breakdown by category.
 */
export interface StorageBreakdownRow {
  /**
   * Size in bytes.
   */
  bytes: number

  /**
   * Category.
   */
  category: StorageCategory

  /**
   * Files.
   */
  files: number
}

export class StorageService {
  /**
   * Run a backfill; scheduled through {@linkcode dispatchBackfill}.
   *
   * @param did
   *   DID.
   * @returns
   *   Promise that resolves when done.
   */
  async backfill(did: DidString): Promise<undefined> {
    const account = await Account.findOrFail(did)
    const backfillSignal = AbortSignal.timeout(backfillTimeout)
    const cids = new Set<string>()
    let capped: boolean
    let didFullListing: boolean
    let pds: string
    let rev: string

    try {
      const resolved = await pdsClient(did)
      pds = resolved.pds

      // Capture repo revision now,
      // so things landing while syncing are picked up next time.
      const latestCommit = await resolved.client.xrpc(
        lexicon.com.atproto.sync.getLatestCommit.main,
        {
          params: { did },
          signal: AbortSignal.any([backfillSignal, AbortSignal.timeout(5000)]),
        }
      )
      rev = latestCommit.body.rev

      // We mostly want newly added blobs to appear timely.
      // But occasionally we have to find removed blobs too.
      const fullSync =
        !account.lastStorageFullSyncAt ||
        account.lastStorageFullSyncAt < DateTime.now().minus({ hours: fullSyncAfterHours })
      const since = fullSync ? undefined : (account.lastStorageSyncRev ?? undefined)
      didFullListing = since === undefined

      let cursor: string | undefined
      let pages = 0

      do {
        const limit = Math.min(1000, maxBlobsPerUser - cids.size)
        const response = await resolved.client.xrpc(lexicon.com.atproto.sync.listBlobs.main, {
          params: { cursor, did, limit, since },
          signal: AbortSignal.any([backfillSignal, AbortSignal.timeout(10_000)]),
        })
        const page = response.body.cids.slice(0, limit)
        pages++
        cursor = response.body.cursor
        // Done, even if there is a cursor.
        if (page.length === 0) cursor = undefined
        for (const cid of page) cids.add(cid)
      } while (cursor && cids.size < maxBlobsPerUser && pages < maxPagesPerBackfill)

      // Not everything was listed.
      capped = cursor !== undefined
    } catch (error) {
      // We still attempted even though we don’t have results.
      // The periodic resyncs will pick this up later.
      account.lastStorageSyncAt = DateTime.now()
      await account.save()
      throw error
    }

    const knownRows = await Blob.query().where('creator', did).select('cid')
    const known = new Set(knownRows.map((row) => row.cid))
    const unknown = [...cids].filter((cid) => !known.has(cid))
    const todo = unknown.slice(0, maxBlobsPerBackfill)
    const errors: Array<unknown> = []
    let rateLimited = false
    let skipped = 0
    let index = 0

    while (index < todo.length && !rateLimited && !backfillSignal.aborted) {
      const slice = todo.slice(index, index + headConcurrency)

      const errorsBefore = errors.length
      const results = await Promise.all(
        slice.map(async (cid) => {
          try {
            return await this.#blob(pds, did, cid, backfillSignal)
          } catch (err) {
            if (err instanceof RateLimitError) rateLimited = true
            errors.push(err)
            return undefined
          }
        })
      )
      const rows = results.filter((row) => row !== undefined)
      skipped += results.length - rows.length - (errors.length - errorsBefore)

      if (rows.length > 0) await Blob.updateOrCreateMany(['cid', 'creator'], rows)

      index += slice.length
    }

    const incomplete = index < unknown.length

    if (errors.length > 0 || incomplete || skipped > 0) {
      logger.warn(
        {
          did,
          err: errors.at(0),
          errors: errors.length,
          rateLimited,
          remaining: unknown.length - index,
          skipped,
          timedOut: backfillSignal.aborted,
        },
        'storage: backfill incomplete'
      )
    }

    // Remove deleted blobs after a full listing, if there are non-empty
    // results.
    if (didFullListing && cids.size > 0) {
      await Blob.query()
        .where('creator', did)
        .whereNotIn('cid', [...cids])
        .delete()
    }

    // Store progress even if some blobs failed.
    account.lastStorageSyncAt = DateTime.now()
    if (didFullListing) {
      account.lastStorageFullSyncAt = DateTime.now()
    }
    // Only trust `rev` as a future `since` baseline when every found blob was
    // actually processed, and nothing failed.
    // When capped, drop it: every next sync is then a (capped) full listing,
    // which keeps the stored set at the cap.
    if (capped) {
      account.lastStorageSyncRev = null
    } else if (errors.length === 0 && !incomplete) {
      account.lastStorageSyncRev = rev
    }
    await account.save()

    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        `Cannot sync storage for \`${did}\`, failed blobs: ${errors.length}`
      )
    }
  }

  /**
   * Queue a backfill job.
   *
   * @param did
   *   DID.
   * @returns
   *   Nothing.
   */
  dispatchBackfill(did: DidString): undefined {
    StorageBackfillJob.dispatch({ did })
      .dedup({ id: did })
      .run()
      .catch((err: unknown) => {
        logger.warn({ did, err }, 'storage: cannot enqueue backfill')
      })
  }

  /**
   * Get a page of blobs,
   * and a breakdown of the user’s entire storage use.
   *
   * @param options
   *   Configuration (required).
   * @returns
   *   Promise that resolves to the result.
   */
  async getStorage(options: GetStorageOptions): Promise<Jsonify<GetStorageResult>> {
    const { after, category = 'all', did, snapshot } = options
    const account = await Account.findOrFail(did)

    // Not done yet.
    if (!account.lastStorageSyncAt) {
      this.dispatchBackfill(did)
      return { state: 'syncing' }
    }

    // Stale.
    if (account.lastStorageSyncAt < DateTime.now().minus({ minutes: staleAfterMinutes })) {
      this.dispatchBackfill(did)
    }

    if (!account.lastStorageFullSyncAt) {
      return { state: 'failed' }
    }

    let pds: string
    try {
      const resolved = await pdsClient(did)
      pds = resolved.pds
    } catch (err) {
      logger.warn({ did, err }, 'storage: cannot resolve PDS')
      return { state: 'failed' }
    }

    let snapshotId = snapshot ? decodeSnapshot(snapshot)?.id : undefined

    if (snapshotId === undefined) {
      const row = await Blob.query().where('creator', did).max('id as id').first()
      const id: unknown = row?.$extras.id
      if (typeof id === 'number') snapshotId = id
    }

    const baseQuery = () => {
      const query = Blob.query().where('creator', did)
      if (snapshotId !== undefined) query.where('id', '<=', snapshotId)
      return query
    }
    const categoryQuery = () => {
      const query = baseQuery()
      if (category !== 'all') query.where('category', category)
      return query
    }
    // We don’t have dates (`createdAt` here is just when it was synced into
    // this database), so the only meaningful sort right now is file size.
    const blobsQuery = categoryQuery()
      .orderBy('size', 'desc')
      .orderBy('cid', 'desc')
      // One extra to know whether there’s more.
      .limit(pageSize + 1)

    const cursor = after ? decodeCursor(after) : undefined

    if (cursor) {
      blobsQuery.whereRaw('(size < ? or (size = ? and cid < ?))', [
        cursor.size,
        cursor.size,
        cursor.cid,
      ])
    }

    const [breakdownRows, rows] = await Promise.all([
      baseQuery().groupBy('category').select('category').count('* as files').sum('size as bytes'),
      blobsQuery,
    ])

    const breakdown = breakdownRows
      .flatMap((row) => {
        if (!isStorageCategory(row.category)) return []
        return [
          {
            bytes: Number(row.$extras.bytes),
            category: row.category,
            files: Number(row.$extras.files),
          },
        ]
      })
      .sort((a, b) => b.bytes - a.bytes)

    const page = rows.slice(0, pageSize)
    const last = page.at(-1)

    return {
      blobs: page.map((row) => ({
        category: isStorageCategory(row.category) ? row.category : 'other',
        cid: row.cid,
        mimeType: row.mimeType ?? undefined,
        size: row.size,
      })),
      breakdown,
      category,
      next: rows.length > pageSize && last ? encodeToken({ cid: last.cid, size: last.size }) : null,
      pds,
      snapshot: snapshotId === undefined ? null : encodeToken({ id: snapshotId }),
      state: 'ready',
      total:
        category === 'all'
          ? breakdown.reduce((sum, row) => sum + row.files, 0)
          : (breakdown.find((row) => row.category === category)?.files ?? 0),
    }
  }

  /**
   * `HEAD` a blob to get its metadata w/o downloading it.
   *
   * @param pds
   *   PDS base URL.
   * @param did
   *   DID.
   * @param cid
   *   Blob CID.
   * @param signal
   *   Signal to stop.
   * @returns
   *   Promise that resolves to a blob row to store or `undefined` when not
   *   found.
   */
  async #blob(
    pds: string,
    did: DidString,
    cid: string,
    signal: AbortSignal
  ): Promise<
    | {
        category: StorageCategory
        cid: string
        creator: string
        mimeType: string | null
        size: number
      }
    | undefined
  > {
    const url = new URL(`/xrpc/${lexicon.com.atproto.sync.getBlob.$nsid}`, pds)
    url.searchParams.set('did', did)
    url.searchParams.set('cid', cid)

    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
    })

    // Rate limit:
    if (response.status === 429) {
      throw new RateLimitError('Rate limited getting blob metadata: HTTP 429')
    }

    // Other client errors are seen removed and not hard errors to retry.
    if (response.status >= 400 && response.status < 500) {
      logger.debug({ cid, did, status: response.status }, 'storage: blob no longer available')
      return
    }

    if (!response.ok) {
      throw new Error(`Cannot get blob metadata: HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length') ?? ''
    const mimeType = contentType && contentType.length <= maxContentTypeSize ? contentType : null
    const contentLengthNumber = /^\d+$/.test(contentLength) ? Number(contentLength) : 0
    const size = Number.isSafeInteger(contentLengthNumber) ? contentLengthNumber : 0

    return {
      category: mediaType(normalizeMimeType(mimeType)),
      cid,
      creator: did,
      mimeType,
      size,
    }
  }
}

export default new StorageService()

/**
 * Error thrown when the PDS rate limits us.
 */
class RateLimitError extends Error {}

/**
 * @param value
 *   Cursor string.
 * @returns
 *   Decoded cursor or `undefined`.
 */
function decodeCursor(value: string): BlobCursor | undefined {
  const { cid, size } = decodeToken(value) ?? {}
  if (typeof cid === 'string' && cid && typeof size === 'number') return { cid, size }
}

/**
 * @param value
 *   Snapshot string.
 * @returns
 *   Decoded snapshot or `undefined`.
 */
function decodeSnapshot(value: string): BlobSnapshot | undefined {
  const { id } = decodeToken(value) ?? {}
  if (typeof id === 'number' && Number.isInteger(id)) return { id }
}
