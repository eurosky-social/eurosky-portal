import cache from '@adonisjs/cache/services/main'
import logger from '@adonisjs/core/services/logger'
import { Client, type DidString } from '@atproto/lex'
import { DateTime } from 'luxon'
import StorageBackfillJob from '#jobs/storage_backfill_job'
import * as lexicon from '#lexicons'
import Account from '#models/account'
import Blob from '#models/blob'
import { SlingshotService } from '#services/slingshot_service'
import { normalizeMimeType, mediaType } from '#shared/mime'
import { type StorageCategory, type StorageTab, isStorageCategory } from '#shared/storage'

/**
 * Default (and per-page increment) blobs to return per category;
 * matches the grid sizing in `inertia/pages/storage/show.tsx`.
 */
const defaultLimit = 48

/**
 * How long between full syncs.
 * These pick up all blob changes including removed blobs.
 */
const fullSyncAfterHours = 24

/**
 * Concurrent `HEAD` requests per user.
 */
const headConcurrency = 10

/**
 * Max blobs to fetch metadata (`HEAD`s) for.
 */
const maxNewBlobsPerBackfill = 5_000

/**
 * How long an incremental sync stays fresh before another is triggered in
 * the background.
 * This picks up on added blobs.
 */
const staleAfterMinutes = 5

/**
 * Pagination cursor.
 * Encodes the ordering key so pagination survives rows being deleted.
 */
interface BlobSnapshotCursor {
  cid: string
  size: number
}

/**
 * Configuration.
 */
export interface GetStorageOptions {
  /**
   * Category or `all` (default: `all`).
   */
  category?: StorageTab | undefined

  /**
   * DID.
   */
  did: DidString

  /**
   * Total blobs to return.
   */
  limit?: number | undefined

  /**
   * Cursor.
   */
  snapshot?: string | undefined
}

/**
 * Ready.
 */
export type GetStorageReadyResult = {
  blobs: Array<StorageBlobRow>
  breakdown: Array<StorageBreakdownRow>
  category: StorageTab
  hasMore: boolean
  snapshot: string | undefined
  state: 'ready'
  total: number
}

/**
 * Syncing.
 */
export type GetStorageSyncingResult = { state: 'syncing' }

/**
 * Result.
 */
export type GetStorageResult = GetStorageReadyResult | GetStorageSyncingResult

/**
 * Blob.
 */
export type StorageBlobRow = {
  category: StorageCategory
  cid: string
  mimeType: string | undefined
  size: number
}

/**
 * Storage breakdown by category.
 */
export type StorageBreakdownRow = {
  bytes: number
  category: StorageCategory
  files: number
}

export class StorageService {
  /**
   * Resolve PDS of a DID so blobs can be read publicly, w/o a user OAuth
   * session.
   */
  #slingshot = new SlingshotService()

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
    const cids: Array<string> = []
    let didFullListing: boolean
    let pds: string
    let rev: string

    try {
      const resolved = await this.#clientFor(did)
      pds = resolved.pds

      // Capture repo revision now,
      // so things landing while syncing are picked up next time.
      const latestCommit = await resolved.client.xrpc(
        lexicon.com.atproto.sync.getLatestCommit.main,
        {
          params: { did },
          signal: AbortSignal.timeout(5000),
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

      do {
        const response = await resolved.client.xrpc(lexicon.com.atproto.sync.listBlobs.main, {
          params: { cursor, did, limit: 1000, since },
          signal: AbortSignal.timeout(10_000),
        })
        cids.push(...response.body.cids)
        cursor = response.body.cursor
      } while (cursor)
    } catch (error) {
      // We still attempted even though we don’t have results.
      // The periodic resyncs will pick this up later.
      account.lastStorageSyncAt = DateTime.now()
      await account.save()
      throw error
    }

    const knownRows = await Blob.query().where('creator', did).select('cid')
    const known = new Set(knownRows.map((row) => row.cid))
    const unknown = cids.filter((cid) => !known.has(cid))
    const unknownCapped = unknown.slice(0, maxNewBlobsPerBackfill)
    const errors: Array<unknown> = []
    let skipped = 0

    let index = 0
    while (index < unknownCapped.length) {
      const slice = unknownCapped.slice(index, index + headConcurrency)

      const errorsBefore = errors.length
      const results = await Promise.all(
        slice.map(async (cid) => {
          try {
            return await this.#blob(pds, did, cid)
          } catch (err) {
            logger.warn({ cid, did, err }, 'storage: cannot get blob metadata')
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

    if (skipped > 0) {
      logger.info({ did, skipped }, 'storage: some listed blobs were no longer available')
    }

    // Remove deleted blobs after a full listing, if there are non-empty
    // results.
    if (didFullListing && cids.length > 0) {
      await Blob.query().where('creator', did).whereNotIn('cid', cids).delete()
    }

    // Store progress even if some blobs failed.
    account.lastStorageSyncAt = DateTime.now()
    if (didFullListing) {
      account.lastStorageFullSyncAt = DateTime.now()
    }
    // Only trust `rev` as a future `since` baseline when every found blob was
    // actually processed, and nothing was capped or failed.
    if (errors.length === 0 && unknownCapped.length === unknown.length) {
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
  async getStorage(options: GetStorageOptions): Promise<GetStorageResult> {
    const { category = 'all', did, limit = defaultLimit, snapshot } = options
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

    const cursor = snapshot ? decodeSnapshot(snapshot) : undefined

    const baseQuery = () => {
      const query = Blob.query().where('creator', did)
      if (category !== 'all') query.where('category', category)
      return query
    }
    // We don’t have dates (`createdAt` here is just when it was synced into
    // this database), so the only meaningful sort right now is file size.
    const blobsQuery = baseQuery().orderBy('size', 'desc').orderBy('cid', 'desc').limit(limit)

    if (cursor) {
      blobsQuery.whereRaw('(size < ? or (size = ? and cid <= ?))', [
        cursor.size,
        cursor.size,
        cursor.cid,
      ])
    }

    const [breakdownRows, rows] = await Promise.all([
      Blob.query()
        .where('creator', did)
        .groupBy('category')
        .select('category')
        .count('* as files')
        .sum('size as bytes'),
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

    const first = rows.at(0)

    return {
      blobs: rows.map((row) => ({
        category: isStorageCategory(row.category) ? row.category : 'other',
        cid: row.cid,
        mimeType: row.mimeType ?? undefined,
        size: row.size,
      })),
      breakdown,
      category,
      hasMore: rows.length >= limit,
      snapshot: cursor
        ? snapshot
        : first
          ? encodeSnapshot({ cid: first.cid, size: first.size })
          : undefined,
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
   * @returns
   *   Promise that resolves to a blob row to store or `undefined` when not
   *   found.
   */
  async #blob(
    pds: string,
    did: DidString,
    cid: string
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

    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10_000) })

    // Rate limit:
    if (response.status === 429) {
      throw new Error(`Rate limited getting blob metadata: HTTP 429`)
    }

    // Other client errors are seen removed and not hard errors to retry.
    if (response.status >= 400 && response.status < 500) {
      logger.debug({ cid, did, status: response.status }, 'storage: blob no longer available')
      return
    }

    if (!response.ok) {
      throw new Error(`Cannot get blob metadata: HTTP ${response.status}`)
    }

    const mimeType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')
    const size = typeof contentLength === 'string' ? Number.parseInt(contentLength, 10) : 0

    return {
      category: mediaType(normalizeMimeType(mimeType)),
      cid,
      creator: did,
      mimeType,
      size,
    }
  }

  /**
   * Build a client.
   *
   * @param did
   *   DID.
   * @returns
   *   Promise that resolves to a client and the PDS it talks to.
   */
  async #clientFor(did: DidString): Promise<{ client: Client; pds: string }> {
    const resolved = await cache.getOrSet({
      factory: (ctx) =>
        this.#slingshot.resolveMiniDoc(did, AbortSignal.timeout(5000)).then((r) => r ?? ctx.skip()),
      grace: '10m',
      key: `pds-resolve:${did}`,
      ttl: '10m',
    })
    if (!resolved) throw new Error(`Cannot resolve PDS for \`${did}\``)
    return { client: new Client(resolved.pds), pds: resolved.pds }
  }
}

export default new StorageService()

/**
 * @param snapshot
 *   Snapshot string (base64url-encoded JSON).
 * @returns
 *   Decoded cursor or `undefined`.
 */
function decodeSnapshot(snapshot: string): BlobSnapshotCursor | undefined {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(snapshot, 'base64url').toString('utf8'))
    if (parsed === null || typeof parsed !== 'object') return
    const cidRaw = 'cid' in parsed ? parsed.cid : undefined
    const cid = typeof cidRaw === 'string' ? cidRaw : undefined
    if (!cid) return
    const sizeRaw = 'size' in parsed ? parsed.size : undefined
    const size = typeof sizeRaw === 'number' ? sizeRaw : undefined
    if (size === undefined) return
    return { cid, size }
  } catch {}
}

/**
 * @param cursor
 *   Cursor.
 * @returns
 *   Snapshot string (base64url-encoded JSON).
 */
function encodeSnapshot(cursor: BlobSnapshotCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url')
}
