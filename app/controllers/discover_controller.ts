import type { HttpContext } from '@adonisjs/core/http'
import { AtStoreService } from '#services/atstore_service'
import AppsTransformer from '#transformers/apps_transformer'

export default class DiscoverController {
  async apps({ inertia }: HttpContext) {
    const atstore = new AtStoreService()
    const apps = await atstore.getApps()

    return inertia.render('apps/show', {
      apps: AppsTransformer.transform({
        gettingStarted: atstore.findByCategory(apps, 'getting-started'),
        exploreMore: atstore.findByCategory(apps, 'explore-more'),
        forWork: atstore.findByCategory(apps, 'for-work'),
      }),
    })
  }
}
