import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import { appHost, toAbsoluteUrl } from '#start/view'

const href = 'https://plausible.io/api/event'

/**
 * Options for {@linkcode PlausibleService.track}.
 */
interface Options {
  /**
   * Client IP.
   *
   * Required by plausible, for events triggered outside of a page load
   * (such as background tasks).
   */
  ip: string | undefined

  /**
   * Whether the event counts towards bounce rate (default: `true`).
   */
  interactive?: boolean | undefined

  /**
   * Extra fields (max 30 per plausible).
   */
  properties?: Record<string, string> | undefined

  /**
   * Referrer URL, if any.
   */
  referrer?: string | undefined

  /**
   * Page URL the event is attributed to (default: app root).
   */
  url?: string | undefined

  /**
   * Client user agent.
   *
   * Required by plausible, for events triggered outside of a page load
   * (such as background tasks).
   */
  userAgent: string | undefined
}

export class PlausibleService {
  /**
   * Send an event to Plausible.
   *
   * No-op when plausible is not enabled (for local dev).
   *
   * @param name
   *   Event name (example: `Activity Feed Viewed`).
   * @param options
   *   Options (required).
   * @returns
   *   Promise that resolves when done.
   * @throws
   *   Never.
   */
  async track(name: string, options: Options): Promise<undefined> {
    if (!env.get('PLAUSIBLE_ENABLED')) return

    try {
      const { interactive, ip, properties, referrer, url, userAgent } = options
      const headers = new Headers({ 'Content-Type': 'application/json' })
      if (userAgent) headers.set('User-Agent', userAgent)
      if (ip) headers.set('X-Forwarded-For', ip)

      const response = await fetch(href, {
        body: JSON.stringify({
          domain: appHost,
          interactive,
          name,
          props: properties,
          referrer,
          url: url ?? toAbsoluteUrl(),
        }),
        headers,
        method: 'POST',
        signal: AbortSignal.timeout(5000),
      })

      if (response.headers.get('x-plausible-dropped') === '1') {
        logger.debug({ name }, 'plausible: event dropped')
      }
    } catch (err) {
      logger.warn({ err, name }, 'plausible: cannot send event')
    }
  }
}

export default new PlausibleService()
