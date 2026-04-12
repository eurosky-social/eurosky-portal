import type { HttpContext } from '@adonisjs/core/http'
import Apps from '#collections/apps'
import AppsTransformer from '#transformers/apps_transformer'

export default class DashboardController {
  async show({ auth, inertia }: HttpContext) {
    const query = await Apps.load()
    const account = await auth.getUserOrFail().getAccount()

    return inertia.render('dashboard/show', {
      showWelcomeMessage: !account.welcomeDismissed,
      apps: AppsTransformer.transform({
        gettingStarted: query.findByCategory('getting-started'),
        exploreMore: query.findByCategory('explore-more'),
        forWork: query.findByCategory('for-work'),
      }),
    })
  }
}
