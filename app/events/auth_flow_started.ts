import { BaseEvent } from '@adonisjs/core/events'

export type Source = 'login' | 'signup'

/**
 * Options for {@linkcode AuthFlowStarted}.
 */
interface Options {
  /**
   * Client IP.
   */
  ip: string

  /**
   * Which flow was started.
   */
  source: Source

  /**
   * Client user agent.
   */
  userAgent?: string | undefined
}

/**
 * OAuth login or signup flow started.
 */
export default class AuthFlowStarted extends BaseEvent {
  ip: string
  source: Source
  userAgent: string | undefined

  constructor(options: Options) {
    super()
    this.ip = options.ip
    this.source = options.source
    this.userAgent = options.userAgent
  }
}
