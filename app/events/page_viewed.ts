import { BaseEvent } from '@adonisjs/core/events'

/**
 * Options for {@linkcode PageViewed}.
 */
interface Options {
  /**
   * Client IP.
   */
  ip: string

  /**
   * Referrer URL, if any.
   */
  referrer?: string | undefined

  /**
   * Absolute URL of the page.
   */
  url: string

  /**
   * Client user agent.
   */
  userAgent?: string | undefined
}

/**
 * A visitor loaded a page.
 */
export default class PageViewed extends BaseEvent {
  ip: string
  referrer: string | undefined
  url: string
  userAgent: string | undefined

  constructor(options: Options) {
    super()
    this.ip = options.ip
    this.referrer = options.referrer
    this.url = options.url
    this.userAgent = options.userAgent
  }
}
