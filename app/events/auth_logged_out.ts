import { BaseEvent } from '@adonisjs/core/events'

/**
 * Options for {@linkcode AuthLoggedOut}.
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
 * User logged out.
 */
export default class AuthLoggedOut extends BaseEvent {
  ip: string
  userAgent: string | undefined

  constructor(options: Options) {
    super()
    this.ip = options.ip
    this.userAgent = options.userAgent
  }
}
