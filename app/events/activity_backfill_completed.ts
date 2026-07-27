import { BaseEvent } from '@adonisjs/core/events'

/**
 * Options for {@linkcode ActivityBackfillCompleted}.
 */
interface Options {
  /**
   * Time spent on actual sync work (excludes queue time).
   */
  durationMs: number

  /**
   * Client IP.
   */
  ip: string

  /**
   * Status: success or not.
   */
  outcome: 'error' | 'success'

  /**
   * Client user agent.
   */
  userAgent?: string | undefined
}

/**
 * Activity feed backfill completed.
 */
export default class ActivityBackfillCompleted extends BaseEvent {
  durationMs: number
  ip: string
  outcome: 'error' | 'success'
  userAgent: string | undefined

  constructor(options: Options) {
    super()
    this.durationMs = options.durationMs
    this.ip = options.ip
    this.outcome = options.outcome
    this.userAgent = options.userAgent
  }
}
