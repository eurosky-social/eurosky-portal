import { BaseEvent } from '@adonisjs/core/events'

/**
 * Options for {@linkcode ActivityBackfillStarted}.
 */
interface Options {
  /**
   * Client IP.
   */
  ip: string

  /**
   * Client user agent.
   */
  userAgent?: string | undefined
}

/**
 * Activity feed backfill started.
 */
export default class ActivityBackfillStarted extends BaseEvent {
  ip: string
  userAgent: string | undefined

  constructor(options: Options) {
    super()
    this.ip = options.ip
    this.userAgent = options.userAgent
  }
}
