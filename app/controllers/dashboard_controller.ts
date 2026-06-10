import type { HttpContext } from '@adonisjs/core/http'
import cache from '@adonisjs/cache/services/main'
import { AtStoreService } from '#services/atstore_service'
import ProfileTransformer from '#transformers/profile_transformer'

export default class DashboardController {
  async show({ auth, inertia }: HttpContext) {
    const atstore = new AtStoreService()
    const apps = await atstore.getApps()
    const user = await auth.getUserOrFail()
    const account = await user.getAccount()
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

    return inertia.render('dashboard/show', {
      showWelcomeMessage: !account.welcomeDismissed,
      profile: profile ? ProfileTransformer.transform(profile) : undefined,
      apps: apps.slice(0, 3),
    })
  }
}
