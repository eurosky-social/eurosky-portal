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
    // Either a cookie set by language picker on the client or the
    // `Accept-Language` sent by the browser.
    const locale = i18nManager.getSupportedLocaleFor(
      ctx.request.plainCookie('locale', { encoded: false }) ||
        ctx.request.header('accept-language') ||
        ''
    )

    ctx.i18n = i18nManager.locale(locale || i18nManager.defaultLocale)
    ctx.containerResolver.bindValue(I18n, ctx.i18n)
    ctx.view.share({
      locale: ctx.i18n.locale,
      metaDescription: ctx.i18n.t('meta.description'),
    })
    return next()
  }
}

function messagesProvider(ctx: HttpContext) {
  return ctx.i18n.createMessagesProvider()
}
