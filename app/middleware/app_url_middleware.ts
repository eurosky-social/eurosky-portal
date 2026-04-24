import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'
import app from '@adonisjs/core/services/app'

const APP_URL = new URL('/', env.get('APP_URL'))

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AppUrlMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (app.inProduction) {
      return next()
    }

    const requestUrl = ctx.request.url(true)
    if (ctx.request.method() === 'GET' && ctx.request.host() !== APP_URL.host) {
      const correctedUrl = new URL(requestUrl, APP_URL.toString()).toString()

      ctx.response.redirect().toPath(correctedUrl)
    }

    return next()
  }
}
