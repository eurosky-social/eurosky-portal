import { DateTime } from 'luxon'
import cache from '@adonisjs/cache/services/main'
import logger from '@adonisjs/core/services/logger'
import { type DidString, isDidString, isNsidString } from '@atproto/lex'
import Account from '#models/account'
import ActivityRecord from '#models/activity_record'
import { normalizeActivityRecord } from '#utils/activity_record'
import { toSqlDateTime } from '#utils/database'
import { dormancyCutoff } from '#utils/dormancy'

const cursorCacheKey = 'jetstream:cursor'
const cursorSaveInterval = 500
const jetstreamUrl = 'wss://jetstream1.eurosky.network/subscribe'
const reconnectDelay = 5_000

interface JetstreamAccount {
  active: boolean
  did: string
  seq: number
  status?: 'deactivated' | 'deleted' | 'desynchronized' | 'suspended' | 'takendown' | 'throttled'
  time: string
}

interface JetstreamCommit {
  cid?: string
  collection: string
  operation: 'create' | 'delete' | 'update'
  record?: Record<string, unknown>
  rev: string
  rkey: string
}

interface JetstreamMessage {
  account?: JetstreamAccount
  commit?: JetstreamCommit
  did: string
  kind: 'account' | 'commit' | 'identity'
  time_us: number
}

/**
 * Watch a Jetstream and mirror commits for known DIDs into
 * database, reconnecting automatically on disconnect.
 */
export class JetstreamService {
  #cursor: number | undefined
  #dids: Set<DidString> = new Set()
  #eventsSinceLastSave = 0
  #reconnectTimeout: ReturnType<typeof setTimeout> | undefined
  #socket: WebSocket | undefined
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

    const socket = this.#socket

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          payload: { wantedDids: [...this.#dids] },
          type: 'options_update',
        })
      )
    }
    // Connect if not already open or connecting.
    else if (
      !socket ||
      socket.readyState === WebSocket.CLOSED ||
      socket.readyState === WebSocket.CLOSING
    ) {
      this.#connect()
    }
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

    const socket = this.#socket

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          payload: { wantedDids: [...this.#dids] },
          type: 'options_update',
        })
      )
    }
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

    if (this.#dids.size > 0) this.#connect()

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
   * Cancel tasks and close the socket.
   *
   * @returns
   *   Nothing.
   */
  stop(): undefined {
    clearInterval(this.#sweepInterval)
    clearTimeout(this.#reconnectTimeout)

    if (this.#socket) {
      this.#socket.onclose = null
      this.#socket.close()
      this.#socket = undefined
    }
  }

  /**
   * Open a socket connection.
   *
   * @returns
   *   Nothing.
   */
  #connect(): undefined {
    clearTimeout(this.#reconnectTimeout)

    const url = new URL(jetstreamUrl)
    if (this.#cursor !== undefined) url.searchParams.set('cursor', String(this.#cursor))

    const socket = new WebSocket(url)
    this.#socket = socket

    socket.onopen = () => {
      logger.info('jetstream: connected to `%s`', jetstreamUrl)
      socket.send(
        JSON.stringify({
          payload: { wantedDids: [...this.#dids] },
          type: 'options_update',
        })
      )
    }

    socket.onmessage = (event) => {
      let message: JetstreamMessage

      try {
        message = JSON.parse(event.data)
      } catch (err) {
        logger.warn({ err }, 'jetstream: cannot handle message')
        return
      }

      if (typeof message.time_us === 'number' && Number.isFinite(message.time_us)) {
        this.#cursor = message.time_us
      }

      this.#eventsSinceLastSave++

      if (this.#eventsSinceLastSave >= cursorSaveInterval) {
        this.#eventsSinceLastSave = 0
        this.#saveCursor().catch((err) => logger.warn({ err }, 'jetstream: cannot save cursor'))
      }

      if (message.kind === 'commit' && message.commit) {
        this.#handleCommit(message.did, message.commit).catch((err) => {
          logger.warn({ err }, 'jetstream: cannot handle commit')
        })
      } else if (message.kind === 'account' && message.account) {
        this.#handleAccount(message.did, message.account).catch((err) => {
          logger.warn({ err }, 'jetstream: cannot handle account')
        })
      }
    }

    socket.onerror = (event) => {
      logger.warn({ event }, 'jetstream: socket error')
    }

    socket.onclose = () => {
      this.#socket = undefined
      this.#saveCursor().catch((err) => logger.warn({ err }, 'jetstream: cannot save cursor'))
      logger.info('jetstream: reconnecting to `%s` (%dms)', jetstreamUrl, reconnectDelay)
      this.#reconnectTimeout = setTimeout(() => this.#connect(), reconnectDelay)
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
  async #handleCommit(did: string, commit: JetstreamCommit): Promise<undefined> {
    const { cid, collection, operation, record, rkey } = commit

    if (!isNsidString(collection)) {
      logger.warn({ collection }, 'jetstream: invalid commit `collection`')
      return
    }
    if (!isDidString(did)) {
      logger.warn({ did }, 'jetstream: invalid commit `did`')
      return
    }

    const uri = `at://${did}/${collection}/${rkey}`

    if (operation === 'delete') {
      if (this.#dids.has(did)) await ActivityRecord.query().where('uri', uri).delete()
      return
    }

    // Create or update.
    if (!this.#dids.has(did)) return

    if (!cid) {
      logger.warn({ operation, uri }, 'jetstream: missing commit `cid` in create/update')
      return
    }

    const { createdAt, text } = normalizeActivityRecord(collection, record) ?? {}
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
  async #handleAccount(did: string, account: JetstreamAccount): Promise<undefined> {
    if (!isDidString(did)) {
      logger.warn({ did }, 'jetstream: invalid account `did`')
      return
    }

    const { active, status } = account
    if (active || !this.#dids.has(did)) return

    logger.info({ did, status }, 'jetstream: account no longer active')
    this.removeDid(did)

    if (status === 'deleted') await Account.query().where('did', did).delete()
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
}

export default new JetstreamService()
