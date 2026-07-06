import type { HttpContext } from '@adonisjs/core/http'
import { AtStoreService } from '#services/atstore_service'
import AppsTransformer from '#transformers/apps_transformer'
import AppTransformer from '#transformers/app_transformer'

export default class DiscoverController {
  async apps({ inertia }: HttpContext) {
    const atstore = new AtStoreService()
    const apps = await atstore.getApps()

    return inertia.render('apps/show', new AppsTransformer({ apps }).toObject())
  }

  async app({ inertia, params, response }: HttpContext) {
    const atstore = new AtStoreService()
    const app = await atstore.getApp(params.rkey)

    if (!app) {
      return response.notFound()
    }

    return inertia.render('apps/detail', { app: AppTransformer.transform(app) })
  }
}
