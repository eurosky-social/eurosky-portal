import type { HttpContext } from '@adonisjs/core/http'
import cache from '@adonisjs/cache/services/main'
import activityService from '#services/activity_service'
import { type App, AtStoreService } from '#services/atstore_service'
import { FavoriteService } from '#services/favorite_service'
import AppSummaryTransformer from '#transformers/app_summary_transformer'
import ProfileTransformer from '#transformers/profile_transformer'

export default class DashboardController {
  async apps({ auth, inertia }: HttpContext) {
    const favorites = await new FavoriteService().getFavorites(auth.getUserOrFail())
    const apps = await getFavoriteApps(favorites)

    // Shows favorites; history is cleared when they change.
    inertia.encryptHistory()

    return inertia.render('dashboard/apps', {
      apps: AppSummaryTransformer.transform(apps),
      favorites,
    })
  }

  async show({ auth, inertia, request }: HttpContext) {
    const atstore = new AtStoreService()
    const user = await auth.getUserOrFail()
    const favorites = await new FavoriteService().getFavorites(user)
    const favoriteApps = await getFavoriteApps(favorites)
    const apps = favoriteApps.length > 0 ? favoriteApps : await atstore.getFeaturedApps()
    const account = await user.getAccount()
    const ip = request.ip()
    const userAgent = request.header('user-agent')
    const activityResult = await activityService.getRecords({
      did: user.did,
      ip,
      limit: 3,
      userAgent,
    })
    const profile = await cache.getOrSet({
      key: `profile:${user.did}`,
      ttl: '10m',
      grace: '10m',
      factory: async (ctx) => {
        const userProfile = await user.fetchProfile({ signal: AbortSignal.timeout(1000) })
        if (!userProfile) {
          return ctx.skip()
        }
        return userProfile
      },
    })

    // Shows favorites; history is cleared when they change.
    inertia.encryptHistory()

    return inertia.render('dashboard/show', {
      // Hard cap at 3.
      apps: AppSummaryTransformer.transform(apps.slice(0, 3)),
      appsKind: favoriteApps.length > 0 ? ('yours' as const) : ('featured' as const),
      favorites,
      activities: activityResult.state === 'ready' ? activityResult.activities : [],
      activityState: activityResult.state,
      profile: profile ? ProfileTransformer.transform(profile) : undefined,
      showWelcomeMessage: !account.welcomeDismissed,
    })
  }
}

/**
 * Get catalog apps the user favorited, sorted by name.
 *
 * @param favorites
 *   URIs of favorited apps.
 * @returns
 *   Apps.
 */
async function getFavoriteApps(favorites: ReadonlyArray<string>): Promise<Array<App>> {
  if (favorites.length === 0) return []

  const favoriteSet = new Set<string>(favorites)
  const apps = await new AtStoreService().getApps()

  return apps
    .filter((app) => favoriteSet.has(app.atUri))
    .sort((a, b) => a.listing.name.localeCompare(b.listing.name))
}
