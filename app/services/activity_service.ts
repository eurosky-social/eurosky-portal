import { DateTime } from 'luxon'
import cache from '@adonisjs/cache/services/main'
import logger from '@adonisjs/core/services/logger'
import {
  type AtUriString,
  Client,
  type DidString,
  type Procedure,
  type Query,
  type XrpcResponse,
  XrpcResponseError,
} from '@atproto/lex'
import BackfillJob from '#jobs/backfill_job'
import * as lexicon from '#lexicons'
import Account from '#models/account'
import ActivityRecord from '#models/activity_record'
import { SlingshotService } from '#services/slingshot_service'
import {
  type Activity,
  type SupportedCollection,
  isSupportedCollection,
  supportedCollections,
  toPreview,
  toValue,
} from '#utils/activity'
import type { ActivityRecordSchema } from '#database/schema'

/**
 * Max activities per user across all collections;
 * see {@linkcode ActivityService.prune}.
 * Very low for now.
 */
const maxActivitiesPerUser = 1000

/**
 * Max `Retry-After` seconds before giving up;
 * see {@linkcode withRateLimitRetry}.
 */
const maxRetryAfterSeconds = 60

/**
 * Pagination cursor.
 * Encodes the ordering key so pagination survives rows being deleted.
 */
interface SnapshotCursor {
  createdAt: string | undefined
  uri: string
}

/**
 * Activity.
 */
export type ActivityRow = {
  /**
   * Content identifier.
   */
  cid: string

  /**
   * Collection.
   */
  collection: SupportedCollection

  /**
   * Date.
   */
  createdAt: string | undefined

  /**
   * Preview.
   */
  text: string | undefined

  /**
   * URI.
   */
  uri: string
}

/**
 * Ready.
 */
export type GetRecordsReadyResult = {
  activities: Array<ActivityRow>
  state: 'ready'
  snapshot: string | undefined
  total: number
}

/**
 * Syncing.
 */
export type GetRecordsSyncingResult = { state: 'syncing' }

/**
 * Result.
 */
export type GetRecordsResult = GetRecordsReadyResult | GetRecordsSyncingResult

/**
 * Configuration for {@linkcode ActivityService.getRecords}.
 */
interface GetRecordsOptions {
  /**
   * DID.
   */
  did: DidString

  /**
   * Client IP.
   */
  ip: string

  /**
   * Total records to return.
   */
  limit: number | undefined

  /**
   * Cursor.
   */
  snapshot?: string | undefined

  /**
   * Client user agent.
   */
  userAgent?: string | undefined
}

export class ActivityService {
  /**
   * Resolve PDS of a DID so records can be read publicly, w/o a user OAuth
   * session.
   */
  #slingshot = new SlingshotService()

  /**
   * Backfill a collection in a user.
   *
   * Used for syncing existing stuff again after changes to
   * {@linkcode toPreview}.
   *
   * @param did
   *   DID.
   * @param collection
   *   NSID.
   * @returns
   *   Promise that resolves when done.
   */
  async backfillCollection(did: DidString, collection: SupportedCollection): Promise<undefined> {
    const { client } = await this.#clientFor(did)
    await this.#syncCollection(client, did, collection, DateTime.now())
    await this.prune(did)
  }

  /**
   * Run a backfill; scheduled through {@linkcode dispatchBackfill}.
   *
   * @param did
   *   DID.
   * @returns
   *   Promise that resolves when done.
   */
  async backfill(did: DidString): Promise<undefined> {
    const { client } = await this.#clientFor(did)

    let describeResponse: XrpcResponse<typeof lexicon.com.atproto.repo.describeRepo.main>
    try {
      describeResponse = await withRateLimitRetry(() =>
        client.xrpc(lexicon.com.atproto.repo.describeRepo.main, {
          params: { repo: did },
          signal: AbortSignal.timeout(5000),
        })
      )
    } catch (err: unknown) {
      // Nothing to try right now. But also not permanent.
      if (
        err instanceof XrpcResponseError &&
        (err.error === 'RepoDeactivated' ||
          err.error === 'RepoNotFound' ||
          err.error === 'RepoTakendown')
      ) {
        logger.info({ did, err }, 'activity: repo unavailable, skipping backfill')
        return
      }

      throw err
    }

    const collections = describeResponse.body.collections.filter(isSupportedCollection)
    const indexedAt = DateTime.now()
    const concurrency = 5
    const errors: Array<unknown> = []

    while (collections.length > 0) {
      const batch = collections.splice(0, concurrency)
      await Promise.all(
        batch.map(async (collection) => {
          try {
            await this.#syncCollection(client, did, collection, indexedAt)
          } catch (err) {
            logger.warn({ collection, did, err }, 'activity: cannot backfill collection')
            errors.push(err)
          }
        })
      )
    }

    await this.prune(did)

    // Not fully synced;
    // let caller retry (queue job backoff, next dashboard visit).
    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        `Could not sync activity for \`${did}\`, failed collections: ${errors.length}`
      )
    }

    const account = await Account.findOrFail(did)
    account.lastActivitySyncAt = indexedAt
    await account.save()
  }

  /**
   * Queue a backfill job.
   *
   * @param did
   *   DID.
   * @param ip
   *   Client IP of the request that triggered the backfill.
   * @param userAgent
   *   Client user agent of the request that triggered the backfill.
   * @returns
   *   Nothing.
   */
  dispatchBackfill(did: DidString, ip: string, userAgent?: string | undefined): undefined {
    BackfillJob.dispatch({ did, ip, userAgent })
      .dedup({ id: did })
      .run()
      .catch((err: unknown) => {
        logger.warn({ did, err }, 'activity: cannot enqueue backfill')
      })
  }

  /**
   * Get rid of a user’s old stuff.
   *
   * @param did
   *   DID.
   * @returns
   *   Promise that resolves when done.
   */
  async prune(did: DidString): Promise<undefined> {
    await ActivityRecord.query()
      .where('did', did)
      .whereNotIn(
        'uri',
        ActivityRecord.query()
          .where('did', did)
          .orderByRaw('created_at DESC NULLS LAST')
          .orderBy('uri', 'desc')
          .limit(maxActivitiesPerUser)
          .select('uri')
      )
      .delete()
  }

  /**
   * Return atproto records.
   *
   * Newest-first and anchored to a snapshot to prevent new arrivals.
   *
   * @param options
   *   Configuration (required).
   * @returns
   *   Promise that resolves to records.
   */
  async getRecords(options: GetRecordsOptions): Promise<GetRecordsResult> {
    const { did, ip, limit = 20, snapshot, userAgent } = options

    const account = await Account.findOrFail(did)

    // Not done yet.
    if (!account.lastActivitySyncAt) {
      this.dispatchBackfill(did, ip, userAgent)
      return { state: 'syncing' }
    }

    const cursor = snapshot ? decodeSnapshot(snapshot) : undefined

    const baseQuery = () => ActivityRecord.query().where('did', did)
    const recordsQuery = baseQuery()
      .orderByRaw('created_at DESC NULLS LAST')
      .orderBy('uri', 'desc')
      .limit(limit)

    if (cursor) {
      if (cursor.createdAt) {
        recordsQuery.whereRaw(
          'created_at < ? or created_at is null or (created_at = ? and uri <= ?)',
          [cursor.createdAt, cursor.createdAt, cursor.uri]
        )
      } else {
        recordsQuery.where((q) => q.whereNull('created_at').where('uri', '<=', cursor.uri))
      }
    }

    const [count, rows] = await Promise.all([
      baseQuery()
        .whereIn('collection', [...supportedCollections])
        .count('* as count')
        .firstOrFail(),
      recordsQuery,
    ])

    const first = rows.at(0)

    return {
      activities: rows.flatMap((row) => {
        if (!isSupportedCollection(row.collection)) return []
        return {
          cid: row.cid,
          collection: row.collection,
          createdAt: row.createdAt?.toISO() ?? undefined,
          text: row.text ?? undefined,
          uri: row.uri,
        }
      }),
      snapshot: cursor
        ? snapshot
        : first
          ? encodeSnapshot({ createdAt: first.createdAt?.toISO() ?? undefined, uri: first.uri })
          : undefined,
      state: 'ready',
      total: Number(count.$extras.count),
    }
  }

  /**
   * Get a record.
   *
   * Records *have* to be locally indexed but data is fetched from the live PDS
   * and not stored.
   * Records that no longer parse, or no longer exist upstream, are removed
   * from the index.
   *
   * @param did
   *   DID.
   * @param collection
   *   NSID.
   * @param rkey
   *   Record key.
   * @returns
   *   Promise that resolves to the record value and the PDS it was fetched
   *   from.
   */
  async getRecord(
    did: DidString,
    collection: SupportedCollection,
    rkey: string
  ): Promise<{ pds: string; uri: AtUriString; value: Activity } | undefined> {
    const uri: AtUriString = `at://${did}/${collection}/${rkey}`
    const row = await ActivityRecord.query().where('uri', uri).first()
    if (!row) return

    const { client, pds } = await this.#clientFor(did)
    let value: Activity | undefined

    try {
      const response = await client.getRecord(collection, rkey, {
        repo: did,
        signal: AbortSignal.timeout(10_000),
      })
      value = toValue(collection, response.body.value)
    } catch (err) {
      // Actually gone upstream: don’t keep stale activity around.
      if (err instanceof XrpcResponseError && err.error === 'RecordNotFound') {
        await ActivityRecord.query().where('uri', uri).delete()
      } else {
        logger.warn({ collection, did, err, rkey }, 'activity: cannot fetch record')
      }

      return
    }

    // No longer parses: don’t keep stale activity around.
    if (!value) {
      await ActivityRecord.query().where('uri', uri).delete()
      return
    }

    return { pds, uri, value }
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
    if (!resolved) throw new Error(`Could not resolve PDS for \`${did}\``)
    return { client: new Client(resolved.pds), pds: resolved.pds }
  }

  /**
   * @param client
   *   Client.
   * @param did
   *   DID.
   * @param collection
   *   NSID.
   * @param indexedAt
   *   Timestamp.
   * @returns
   *   Promise that resolves when done.
   */
  async #syncCollection(
    client: Client,
    did: DidString,
    collection: SupportedCollection,
    indexedAt: DateTime
  ): Promise<undefined> {
    let cursor: string | undefined
    let seen = 0

    do {
      const result = await withRateLimitRetry(() =>
        client.listRecords(collection, {
          cursor,
          limit: 100,
          repo: did,
          reverse: true,
          signal: AbortSignal.timeout(10_000),
        })
      )

      const records = result.body?.records ?? []
      if (records.length === 0) break
      seen += records.length

      const update: Array<Partial<ActivityRecordSchema>> = []
      const remove: Array<string> = []

      for (const record of records) {
        const { cid, uri, value } = record
        const activity = toValue(collection, value)
        if (activity) {
          const { createdAt, text } = toPreview(activity)
          const rkey = uri.split('/').pop()!
          update.push({ cid, collection, createdAt, did, indexedAt, rkey, text, uri })
        } else {
          remove.push(uri)
        }
      }

      if (update.length > 0) await ActivityRecord.updateOrCreateMany('uri', update)
      if (remove.length > 0) await ActivityRecord.query().whereIn('uri', remove).delete()

      cursor = result.body.cursor
    } while (cursor && seen < maxActivitiesPerUser)
  }
}

export default new ActivityService()

/**
 * @param snapshot
 *   Snapshot string (base64url-encoded JSON).
 * @returns
 *   Decoded cursor or `undefined`.
 */
function decodeSnapshot(snapshot: string): SnapshotCursor | undefined {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(snapshot, 'base64url').toString('utf8'))
    if (parsed === null || typeof parsed !== 'object') return
    const uriRaw = 'uri' in parsed ? parsed.uri : undefined
    const uri = typeof uriRaw === 'string' ? uriRaw : undefined
    if (!uri) return
    const createdAtRaw = 'createdAt' in parsed ? parsed.createdAt : undefined
    const createdAt = typeof createdAtRaw === 'string' ? createdAtRaw : undefined
    return { createdAt, uri }
  } catch {}
}

/**
 * @param cursor
 *   Cursor.
 * @returns
 *   Snapshot string (base64url-encoded JSON).
 */
function encodeSnapshot(cursor: SnapshotCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url')
}

/**
 * Retry a request if rate limited;
 * honors `Retry-After` up to a point ({@linkcode maxRetryAfterSeconds});
 * Rethrows other errors.
 *
 * @param request
 *   Attempt a request, which may throw `RateLimitExceeded` errors.
 * @returns
 *   Promise that resolves to the result of `request`.
 */
async function withRateLimitRetry<M extends Procedure | Query>(
  request: () => Promise<XrpcResponse<M>>
): Promise<XrpcResponse<M>> {
  try {
    return await request()
  } catch (err: unknown) {
    if (!(err instanceof XrpcResponseError) || err.error !== 'RateLimitExceeded') throw err

    const retryAfter = Number(err.headers.get('retry-after'))
    if (!Number.isFinite(retryAfter) || retryAfter <= 0 || retryAfter > maxRetryAfterSeconds) {
      throw err
    }

    logger.warn({ err, retryAfter }, 'activity: rate limited, waiting before retry')
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
    return request()
  }
}
