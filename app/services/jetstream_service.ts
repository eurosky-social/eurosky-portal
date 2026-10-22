import { DateTime } from 'luxon'
import cache from '@adonisjs/cache/services/main'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import {
  type AccountData,
  type CommitOperation,
  type JetstreamEvent,
  JetstreamSubscription,
} from '@atcute/jetstream'
import { type DidString, type JsonValue, jsonToLex } from '@atproto/lex'
import Account from '#models/account'
import ActivityRecord from '#models/activity_record'
import { supportedCollections, toPreview, toValue } from '#utils/activity'
import { toSqlDateTime } from '#utils/database'
import { dormancyCutoff } from '#utils/dormancy'

const cursorCacheKey = 'jetstream:cursor'
const cursorSaveInterval = 500
const jetstreamUrl = 'wss://jetstream1.eurosky.network'
const wantedCollections = [...supportedCollections]

type Events = ReturnType<JetstreamSubscription[typeof Symbol.asyncIterator]>

/**
 * Watch a Jetstream and mirror commits for known DIDs into
 * database, reconnecting automatically on disconnect.
 */
export class JetstreamService {
  #cursor: number | undefined
  #dids: Set<DidString> = new Set()
  #events: Events | undefined
  #eventsSinceLastSave = 0
  #subscription: JetstreamSubscription | undefined
  #sweepInterval: ReturnType<typeof setInterval> | undefined

  /**
   * Start watching a DID.
   *
   * @param did
   *   DID to watch.
   * @returns
   *   Nothing.
   */
  addDid(did: DidString): undefined {
    if (this.#dids.has(did)) return
    this.#dids.add(did)
    this.#update()
  }

  /**
   * Stop watching a DID.
   *
   * @param did
   *   DID to stop watching.
   * @returns
   *   Nothing.
   */
  removeDid(did: DidString): undefined {
    if (!this.#dids.delete(did)) return
    this.#update()
  }

  /**
   * Load known DIDs and the last saved cursor, connect if there’s anyone to
   * watch, and schedule sweep tasks.
   *
   * @returns
   *   Promise that resolves when loaded.
   */
  async start(): Promise<undefined> {
    const accounts = await Account.query()
      .where('lastActiveAt', '>=', toSqlDateTime(dormancyCutoff()))
      .select('did')
    for (const account of accounts) this.#dids.add(account.did)

    const cachedCursor: unknown = await cache.get({ key: cursorCacheKey })
    if (typeof cachedCursor === 'number') this.#cursor = cachedCursor

    this.#update()

    // Sweep now and every 6 hours.
    const task = (): undefined => {
      this.#sweep().catch((err: unknown): undefined => {
        logger.warn({ err }, 'jetstream: cannot sweep dormant accounts')
      })
    }

    task()
    this.#sweepInterval = setInterval(task, 6 * 60 * 60 * 1000)
  }

  /**
   * Cancel tasks and close the connection.
   *
   * @returns
   *   Nothing.
   */
  stop(): undefined {
    clearInterval(this.#sweepInterval)
    this.#disconnect()
  }

  /**
   * Open a connection.
   *
   * @returns
   *   Nothing.
   */
  #connect(): undefined {
    const subscription = new JetstreamSubscription({
      cursor: this.#cursor,
      onConnectionClose() {
        logger.info('jetstream: disconnected from `%s`', jetstreamUrl)
      },
      onConnectionError(event) {
        logger.warn({ event }, 'jetstream: socket error')
      },
      onConnectionOpen() {
        logger.info('jetstream: connected to `%s`', jetstreamUrl)
      },
      onError(err) {
        logger.warn({ err }, 'jetstream: invalid event')
      },
      url: jetstreamUrl,
      wantedCollections,
      wantedDids: [...this.#dids],
    })
    const events = subscription[Symbol.asyncIterator]()

    this.#events = events
    this.#subscription = subscription

    this.#listen(events).catch((err: unknown) => {
      logger.warn({ err }, 'jetstream: cannot listen to events')
    })
  }

  /**
   * Close the connection, if any, and persist the cursor.
   *
   * @returns
   *   Nothing.
   */
  #disconnect(): undefined {
    if (!this.#subscription) return

    // Ends `#listen`; drops events that are queued but not handled yet,
    // which is fine as `#cursor` only includes handled events.
    this.#events?.dispose()
    this.#events = undefined
    this.#subscription = undefined
    this.#saveCursor().catch((err: unknown) => {
      logger.warn({ err }, 'jetstream: cannot save cursor')
    })
  }

  /**
   * Handle an event.
   *
   * @param event
   *   Event.
   * @returns
   *   Promise that resolves when handled.
   */
  async #handleEvent(event: JetstreamEvent): Promise<undefined> {
    if (event.kind === 'commit') {
      await this.#handleCommit(event.did, event.commit)
    } else if (event.kind === 'account') {
      await this.#handleAccount(event.did, event.account)
    }

    this.#cursor = event.time_us
    this.#eventsSinceLastSave++

    if (this.#eventsSinceLastSave >= cursorSaveInterval) {
      this.#eventsSinceLastSave = 0
      await this.#saveCursor()
    }
  }

  /**
   * Handle events, one at a time, until the connection is closed.
   *
   * @param events
   *   Events.
   * @returns
   *   Promise that resolves when the connection is closed.
   */
  async #listen(events: Events): Promise<undefined> {
    for await (const event of events) {
      await this.#handleEvent(event).catch((err: unknown) => {
        logger.warn({ err, kind: event.kind }, 'jetstream: cannot handle event')
      })
    }
  }

  /**
   * Handle commits.
   *
   * @param did
   *   DID.
   * @param commit
   *   Commit.
   * @returns
   *   Promise that resolves when handled.
   */
  async #handleCommit(did: DidString, commit: CommitOperation): Promise<undefined> {
    if (!this.#dids.has(did)) return

    const { collection, rkey } = commit
    const uri = `at://${did}/${collection}/${rkey}`

    if (commit.operation === 'delete') {
      await ActivityRecord.query().where('uri', uri).delete()
      return
    }

    // Create or update.
    const { cid, record } = commit
    // turn `$link`s and `$bytes` into CIDs and bytes.
    const activity = toValue(collection, jsonToLex(record as JsonValue))

    // Unknown collection / invalid record.
    if (!activity) {
      logger.warn({ collection, uri }, 'jetstream: record does not match its lexicon, dropping')
      await ActivityRecord.query().where('uri', uri).delete()
      return
    }

    const { createdAt, text } = toPreview(activity)
    const indexedAt = DateTime.now()

    await ActivityRecord.updateOrCreate(
      { uri },
      { cid, collection, createdAt, did, indexedAt, rkey, text, uri }
    )

    const { default: activityService } = await import('#services/activity_service')
    await activityService.prune(did)
  }

  /**
   * Handle account changes.
   *
   * @param did
   *   DID.
   * @param account
   *   Account status.
   * @returns
   *   Promise that resolves when handled.
   */
  async #handleAccount(did: DidString, account: AccountData): Promise<undefined> {
    const { active, status } = account
    if (active || !this.#dids.has(did)) return

    logger.info({ did, status }, 'jetstream: account no longer active')
    this.removeDid(did)

    if (status === 'deleted') {
      const oauthClient = await app.container.make('atproto.oauth.client')
      await oauthClient.client.revoke(did).catch((err: unknown) => {
        logger.warn({ did, err }, 'jetstream: cannot revoke oauth session for deleted account')
      })
      await Account.query().where('did', did).delete()
    }
  }

  /**
   * Persist cursor.
   *
   * @returns
   *   Promise that resolves when done.
   */
  async #saveCursor() {
    if (this.#cursor === undefined) return
    await cache.set({ key: cursorCacheKey, value: this.#cursor })
  }

  /**
   * Stop watching dormant accounts.
   *
   * Marks dormant accounts as `lastActivitySyncAt: null` and removes their now
   * unreachable activities.
   *
   * @returns
   *   Promise that resolves when done.
   */
  async #sweep() {
    const accounts = await Account.query()
      .where('lastActiveAt', '<', toSqlDateTime(dormancyCutoff()))
      .whereNotNull('lastActivitySyncAt')
      .select('did')

    const dids = accounts
      .filter((account) => this.#dids.has(account.did))
      .map((account) => account.did)
    if (dids.length === 0) return

    for (const did of dids) this.removeDid(did)

    await Account.query().whereIn('did', dids).update({ lastActivitySyncAt: null })
    await ActivityRecord.query().whereIn('did', dids).delete()

    logger.info({ count: dids.length }, 'jetstream: stopped watching dormant accounts')
  }

  /**
   * Connect, update who to watch, or disconnect, based on the current DIDs.
   *
   * @returns
   *   Nothing.
   */
  #update(): undefined {
    if (this.#dids.size === 0) {
      this.#disconnect()
    } else if (this.#subscription) {
      this.#subscription.updateOptions({ wantedDids: [...this.#dids] })
    } else {
      this.#connect()
    }
  }
}

export default new JetstreamService()
