import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'
import PageViewed from '#events/page_viewed'
import { toAbsoluteUrl } from '#services/url_service'

/**
 * Server-side version of a client-side analytics script.
 *
 * Tracks any GET request whose response is the HTML shell or a full Inertia
 * navigation.
 * Ignores partial Inertia reloads.
 */
export default class TrackPageviewMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const output = await next()
    const { inertia, request, response } = ctx
    const { isInertiaRequest, isPartialRequest } = inertia.requestInfo()
    const responseContentType = response.getHeader('content-type')?.toString()

    if (
      request.method() === 'GET' &&
      !isPartialRequest &&
      (isInertiaRequest || responseContentType?.includes('text/html'))
    ) {
      PageViewed.dispatch({
        ip: request.ip(),
        referrer: request.header('referer'),
        // `request.url()` defaults to excluding the query string.
        url: toAbsoluteUrl(request.url()),
        userAgent: request.header('user-agent'),
      }).catch((err: unknown) => {
        logger.warn({ err }, 'plausible: cannot track pageview')
      })
    }

    return output
  }
}
