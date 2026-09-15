import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'
import app from '@adonisjs/core/services/app'

const APP_URL = new URL('/', env.get('APP_URL'))

/**
 * Redirect between IPs (`127.0.0.1:4075`) and hostnames (`localhost:4075`) in
 * development, based on what’s configured in `.env`.
 * Needs to be correct for OAuth flow.
 */
export default class AppUrlMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (app.inProduction) return next()

    const url = ctx.request.url(true)

    if (ctx.request.method() === 'GET' && ctx.request.host() !== APP_URL.host) {
      return ctx.response.redirect().toPath(new URL(url, APP_URL).href)
    }

    return next()
  }
}
