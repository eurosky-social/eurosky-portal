import type { HttpContext } from '@adonisjs/core/http'
import { asAtUriString } from '@atproto/syntax'
import { Monocle } from '@monocle.sh/adonisjs-agent'
import { AtStoreService } from '#services/atstore_service'
import {
  type FavoriteAction,
  type FavoriteIntent,
  FavoriteService,
  isScopeMissingError,
} from '#services/favorite_service'
import AppsTransformer from '#transformers/apps_transformer'
import AppTransformer from '#transformers/app_transformer'
import { favoriteScope, loginScopes } from '#utils/oauth'

export default class DiscoverController {
  async apps({ auth, inertia }: HttpContext) {
    const atstore = new AtStoreService()
    const apps = await atstore.getApps()
    const favorites = auth.user ? await new FavoriteService().getFavorites(auth.user) : undefined

    // Shows favorites; history is cleared when they change.
    if (favorites) inertia.encryptHistory()

    return inertia.render('apps/show', {
      ...new AppsTransformer({ apps }).toObject(),
      favorites,
    })
  }

  async app({ auth, inertia, params, response }: HttpContext) {
    const atstore = new AtStoreService()
    const app = await atstore.getApp(params.rkey)

    if (!app) {
      return response.notFound()
    }

    const favorites = auth.user ? await new FavoriteService().getFavorites(auth.user) : undefined

    // Shows favorites; history is cleared when they change.
    if (favorites) inertia.encryptHistory()

    return inertia.render('apps/detail', {
      app: AppTransformer.transform(app),
      favorite: favorites ? favorites.includes(asAtUriString(app.atUri)) : undefined,
    })
  }

  async favorite(ctx: HttpContext) {
    return this.#toggle(ctx, 'favorite')
  }

  async unfavorite(ctx: HttpContext) {
    return this.#toggle(ctx, 'unfavorite')
  }

  /**
   * Favorite or unfavorite;
   * asks for {@linkcode favoriteScope} if needed.
   */
  async #toggle(
    { auth, i18n, inertia, logger, oauth, params, response, session }: HttpContext,
    action: FavoriteAction
  ) {
    const user = auth.getUserOrFail()
    const atstore = new AtStoreService()
    const app = await atstore.getApp(params.rkey)

    if (!app) {
      return response.notFound()
    }

    const subject = asAtUriString(app.atUri)

    try {
      await new FavoriteService()[action](user, subject)
      // Pages showing favorites are now stale in history.
      session.flash('clearHistory', true)
    } catch (err) {
      if (isScopeMissingError(err)) {
        const intent: FavoriteIntent = { action, did: user.did, subject }
        session.put('favorite_intent', intent)
        session.setIntendedUrl(response.redirect().getPreviousUrl('/apps'))

        const authorizationUrl = await oauth.authorize(user.did, {
          scope: [...loginScopes, favoriteScope].join(' '),
          ui_locales: i18n.locale,
        })

        return inertia.location(authorizationUrl)
      }

      logger.error({ err }, 'favorites: cannot %s `%s`', action, subject)
      Monocle.captureException(err, {
        extra: { action, subject },
        tags: { component: 'favorites' },
      })
      session.flash('errorsBag', { favorite: i18n.t('apps.favoriteFailed') })
    }

    return response.redirect().back()
  }
}
