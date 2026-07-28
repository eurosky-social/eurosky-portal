import { BaseEvent } from '@adonisjs/core/events'

export type Outcome = 'denied' | 'error' | 'success'
export type Source = 'login' | 'signup'

/**
 * Options for {@linkcode AuthFlowCompleted}.
 */
interface Options {
  /**
   * Client IP.
   */
  ip: string

  /**
   * How the flow ended.
   */
  outcome: Outcome

  /**
   * Which flow this was.
   */
  source: Source

  /**
   * Client user agent.
   */
  userAgent?: string | undefined
}

/**
 * OAuth login or signup flow completed.
 */
export default class AuthFlowCompleted extends BaseEvent {
  ip: string
  outcome: Outcome
  source: Source
  userAgent: string | undefined

  constructor(options: Options) {
    super()
    this.ip = options.ip
    this.outcome = options.outcome
    this.source = options.source
    this.userAgent = options.userAgent
  }
}
