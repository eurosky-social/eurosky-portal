import { BaseEvent } from '@adonisjs/core/events'

/**
 * Options for {@linkcode ActivityFeedViewed}.
 */
interface Options {
  /**
   * Client IP.
   */
  ip: string

  /**
   * Status: already synced or still backfilling.
   */
  state: 'ready' | 'syncing'

  /**
   * Client user agent.
   */
  userAgent?: string | undefined
}

/**
 * Activity feed viewed.
 */
export default class ActivityFeedViewed extends BaseEvent {
  ip: string
  state: 'ready' | 'syncing'
  userAgent: string | undefined

  constructor(options: Options) {
    super()
    this.ip = options.ip
    this.state = options.state
    this.userAgent = options.userAgent
  }
}
