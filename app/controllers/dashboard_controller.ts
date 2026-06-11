import type { HttpContext } from '@adonisjs/core/http'
import cache from '@adonisjs/cache/services/main'
import Apps from '#collections/apps'
import ProfileTransformer from '#transformers/profile_transformer'

export default class DashboardController {
  async show({ auth, inertia }: HttpContext) {
    const query = await Apps.load()
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
      // TODO: apps are now static and should be requested/cached/displayed all
      // together.
      // If there are detail pages, then it’s a good time to request and cache
      // per app.
      // Then this should not use `all().slice()` but something better to only
      // load what is needed.
      apps: query.all().slice(0, 3),
    })
  }
}
