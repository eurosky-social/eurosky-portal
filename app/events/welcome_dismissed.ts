import { BaseEvent } from '@adonisjs/core/events'

/**
 * Options for {@linkcode WelcomeDismissed}.
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
 * Dashboard welcome message dismissed.
 */
export default class WelcomeDismissed extends BaseEvent {
  ip: string
  userAgent: string | undefined

  constructor(options: Options) {
    super()
    this.ip = options.ip
    this.userAgent = options.userAgent
  }
}
