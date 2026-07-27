import { BaseEvent } from '@adonisjs/core/events'

type State = 'ready' | 'syncing'

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
  state: State

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
  state: State
  userAgent: string | undefined

  constructor(options: Options) {
    super()
    this.ip = options.ip
    this.state = options.state
    this.userAgent = options.userAgent
  }
}
