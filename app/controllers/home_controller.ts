import type { HttpContext } from '@adonisjs/core/http'
import { AtStoreService } from '#services/atstore_service'
import AppsTransformer from '#transformers/apps_transformer'

export default class HomeController {
  async show({ inertia }: HttpContext) {
    const atstore = new AtStoreService()
    const apps = await atstore.getApps()

    return inertia.render('home', new AppsTransformer({ apps }).toObject())
  }
}
