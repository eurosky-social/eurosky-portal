import '@inertiajs/core'
import type { InferSharedProps } from '@adonisjs/inertia/types'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Monocle } from '@monocle.sh/adonisjs-agent'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'
import Account from '#models/account'
import AccountTransformer from '#transformers/account_transformer'

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
    const { auth, session, oauth } = ctx as Partial<HttpContext>

    let account: Account | undefined
    if (auth?.user?.did) {
      account = (await Account.find(auth.user.did)) ?? undefined

      // If there is an auth session, but no corresponding account row,
      // we’re in a weird place.
      // Best to log out.
      if (!account) {
        Monocle.captureMessage('Auth session referenced an account with no matching row', {
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
     * Fetching the first error from the flash messages
     */
    const errorsBag = session?.flashMessages.get('errorsBag') ?? {}
    const error: string | undefined = Object.keys(errorsBag)
      .filter((code) => code !== 'E_VALIDATION_ERROR')
      .map((code) => errorsBag[code])[0]

    /**
     * Data shared with all Inertia pages. Make sure you are using
     * transformers for rich data-types like Models.
     */
    return {
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      flash: ctx.inertia.always({
        error: error,
      }),
      isAuthenticated: !!auth?.user,
      authorizationServer: ctx.inertia.always(auth?.user?.authorizationServer),
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
