import { BaseEvent } from '@adonisjs/core/events'

/**
 * Options for {@linkcode TermsAccepted}.
 */
interface Options {
  /**
   * Client IP.
   */
  ip: string

  /**
   * Whether this is a reacceptance as opposed to the initial acceptance.
   */
  reacceptance: boolean

  /**
   * Client user agent.
   */
  userAgent?: string | undefined
}

/**
 * Terms of service and privacy policy accepted.
 */
export default class TermsAccepted extends BaseEvent {
  ip: string
  reacceptance: boolean
  userAgent: string | undefined

  constructor(options: Options) {
    super()
    this.ip = options.ip
    this.reacceptance = options.reacceptance
    this.userAgent = options.userAgent
  }
}
