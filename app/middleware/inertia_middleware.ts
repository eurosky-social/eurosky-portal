import '@inertiajs/core'
import type { InferSharedProps } from '@adonisjs/inertia/types'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'
import Account from '#models/account'
import AccountTransformer from '#transformers/account_transformer'
import { type FlashMessage, getFlashedSessionValue } from '#utils/session'
import { captureMessage } from '#utils/telemetry'
import { isMessageKey } from '#shared/i18n'
import { defaultLocale, isLocale } from '#shared/locale'
import { defaultTheme, isTheme, themeCookieName } from '#shared/theme'

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  async share(ctx: HttpContext) {
    /**
     * The share method is called everytime an Inertia page is rendered. In
     * certain cases, a page may get rendered before the session middleware
     * or the auth middleware are executed. For example: During a 404 request.
     *
     * In that case, we must always assume that HttpContext is not fully hydrated
     * with all the properties
     */
    const { auth, i18n, session, oauth } = ctx as Partial<HttpContext>

    let account: Account | undefined
    if (auth?.user?.did) {
      account = (await Account.find(auth.user.did)) ?? undefined

      // If there is an auth session, but no corresponding account row,
      // we’re in a weird place.
      // Best to log out.
      if (!account) {
        captureMessage('Auth session referenced an account with no matching row', {
          extra: { did: auth.user.did },
          level: 'warning',
          tags: { component: 'inertia', type: 'stale_session_account' },
        })

        await oauth?.logout(auth.user.did)
        await auth.use('web').logout()
        session?.clear()
      }
    }

    /**
     * Something changed that makes pages in history stale
     * (such as favorites);
     * Clear them.
     */
    if (session && getFlashedSessionValue(session, 'clearHistory')) {
      ctx.inertia.clearHistory()
    }

    /**
     * Theme chosen with the toggle (a cookie) or `system`.
     */
    const themeCookie = ctx.request.plainCookie(themeCookieName, { encoded: false })
    const theme = isTheme(themeCookie) ? themeCookie : defaultTheme
    ctx.view.share({ theme })

    /**
     * Error to show: ours, as a message key,
     * or else the first one Adonis flashed (such as `E_UNAUTHORIZED_ACCESS`),
     * as the key `errors.$code` if there is one (Adonis looks that up too),
     * or as its text.
     */
    const errorsBag = (session && getFlashedSessionValue(session, 'errorsBag')) ?? {}
    const code = Object.keys(errorsBag).find((name) => name !== 'E_VALIDATION_ERROR')
    const codeKey = 'errors.' + code
    const error: FlashMessage | { text: string } | undefined =
      (session && getFlashedSessionValue(session, 'errorMessage')) ??
      (code === undefined
        ? undefined
        : isMessageKey(codeKey)
          ? { key: codeKey }
          : { text: errorsBag[code] ?? '' })

    /**
     * Data shared with all Inertia pages. Make sure you are using
     * transformers for rich data-types like Models.
     */
    return {
      authorizationServer: ctx.inertia.always(auth?.user?.authorizationServer),
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      flash: ctx.inertia.always({
        error: error,
      }),
      isAuthenticated: !!auth?.user,
      locale: ctx.inertia.always(isLocale(i18n?.locale) ? i18n.locale : defaultLocale),
      theme: ctx.inertia.always(theme),
      user: ctx.inertia.always(
        auth?.user && account ? AccountTransformer.transform(account) : undefined
      ),
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)

    const output = await next()
    this.dispose(ctx)

    return output
  }
}

type MiddlewareSharedProps = InferSharedProps<InertiaMiddleware>

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends MiddlewareSharedProps {}
}

declare module '@inertiajs/core' {
  export interface InertiaConfig {
    sharedPageProps: MiddlewareSharedProps
    flashDataType: {
      error: string
    }
  }
}
