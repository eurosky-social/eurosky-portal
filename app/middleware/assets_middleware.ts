import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import app from '@adonisjs/core/services/app'
import StaticMiddleware from '@adonisjs/static/static_middleware'

export default class AssetsMiddleware {
  private middleware: StaticMiddleware

  constructor() {
    this.middleware = new StaticMiddleware(app.makePath('data'), {
      enabled: true,
      acceptRanges: false,
      cacheControl: true,
      maxAge: '1d',
      etag: true,
      lastModified: true,
      dotFiles: 'ignore',
    })
  }

  async handle(ctx: HttpContext, next: NextFn) {
    // Limit to the files inside the `data/assets/` directory:
    if (ctx.request.url().startsWith('/assets')) {
      return this.middleware.handle(ctx, () => {
        return ctx.response.notFound()
      })
    }

    return next()
  }
}
