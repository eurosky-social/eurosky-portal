import { type HttpContext, RequestValidator } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import i18nManager from '@adonisjs/i18n/services/main'
import { I18n } from '@adonisjs/i18n'

// Register types.
declare module '@adonisjs/core/http' {
  export interface HttpContext {
    i18n: I18n
  }
}

/**
 * Detect the locale of the request and share it as `ctx.i18n`.
 */
export default class DetectUserLocaleMiddleware {
  /**
   * Set up the messages provider for request validation.
   */
  static {
    RequestValidator.messagesProvider = messagesProvider
  }

  /**
   * Set the locale for the current context.
   */
  async handle(ctx: HttpContext, next: NextFn) {
    // Prefer `X-Locale` that we set on the client side.
    // Fall back to `Accept-Language` by browsers.
    const locale = i18nManager.getSupportedLocaleFor(
      ctx.request.header('x-locale') || ctx.request.header('accept-language') || ''
    )

    ctx.i18n = i18nManager.locale(locale || i18nManager.defaultLocale)
    ctx.containerResolver.bindValue(I18n, ctx.i18n)
    return next()
  }
}

function messagesProvider(ctx: HttpContext) {
  return ctx.i18n.createMessagesProvider()
}
