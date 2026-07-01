import { DateTime } from 'luxon'
import cache from '@adonisjs/cache/services/main'
import logger from '@adonisjs/core/services/logger'
import { type DidString, isDidString, isNsidString } from '@atproto/lex'
import Account from '#models/account'
import ActivityRecord from '#models/activity_record'
import { normalizeActivityRecord } from '#utils/activity_record'

const cursorCacheKey = 'jetstream:cursor'
const cursorSaveInterval = 500
const jetstreamUrl = 'wss://jetstream1.eurosky.network/subscribe'
const reconnectDelay = 5_000

interface JetstreamCommit {
  cid?: string
  collection: string
  operation: 'create' | 'delete' | 'update'
  record?: Record<string, unknown>
  rev: string
  rkey: string
}

interface JetstreamMessage {
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

  /**
   * Load known DIDs and the last saved cursor, then connect if there’s
   * anyone to watch.
   *
   * @returns
   *   Promise that resolves when loaded.
   */
  async start() {
    const accounts = await Account.query().select('did')
    for (const account of accounts) this.#dids.add(account.did)

    const cachedCursor: unknown = await cache.get({ key: cursorCacheKey })
    if (typeof cachedCursor === 'number') this.#cursor = cachedCursor

    if (this.#dids.size > 0) this.#connect()
  }

  /**
   * Cancel any pending reconnect and close the socket.
   *
   * @returns
   *   Nothing.
   */
  stop() {
    clearTimeout(this.#reconnectTimeout)

    if (this.#socket) {
      this.#socket.onclose = null
      this.#socket.close()
      this.#socket = undefined
    }
  }

  /**
   * Start watching a DID.
   *
   * @param did
   *   DID to watch.
   * @returns
   *   Nothing.
   */
  addDid(did: DidString) {
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
   * Open a socket connection.
   *
   * @returns
   *   Nothing.
   */
  #connect() {
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
      } catch (error) {
        logger.warn({ error }, 'jetstream: cannot handle message')
        return
      }

      if (typeof message.time_us === 'number' && Number.isFinite(message.time_us)) {
        this.#cursor = message.time_us
      }

      this.#eventsSinceLastSave++

      if (this.#eventsSinceLastSave >= cursorSaveInterval) {
        this.#eventsSinceLastSave = 0
        this.#saveCursor().catch((error) => logger.warn({ error }, 'jetstream: cannot save cursor'))
      }

      if (message.kind === 'commit' && message.commit) {
        this.#handleCommit(message.did, message.commit).catch((error) => {
          logger.warn({ error }, 'jetstream: cannot handle commit')
        })
      }
    }

    socket.onerror = (event) => {
      logger.warn({ event }, 'jetstream: socket error')
    }

    socket.onclose = () => {
      this.#socket = undefined
      this.#saveCursor().catch((error) => logger.warn({ error }, 'jetstream: cannot save cursor'))
      logger.info('jetstream: reconnecting to `%s` (%dms)', jetstreamUrl, reconnectDelay)
      this.#reconnectTimeout = setTimeout(() => this.#connect(), reconnectDelay)
    }
  }

  /**
   * Apply a commit, ignoring untracked DIDs.
   *
   * @param did
   *   DID.
   * @param commit
   *   Commit.
   * @returns
   *   Promise that resolves when handled.
   */
  async #handleCommit(did: string, commit: JetstreamCommit) {
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

    const { createdAt, text } = normalizeActivityRecord(collection, record)
    const indexedAt = DateTime.now()

    await ActivityRecord.updateOrCreate(
      { uri },
      { cid, collection, createdAt, did, indexedAt, rkey, text, uri }
    )
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
}

export default new JetstreamService()
