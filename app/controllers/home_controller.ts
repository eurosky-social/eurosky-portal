import type { HttpContext } from '@adonisjs/core/http'
import Apps from '#collections/apps'
import AppTransformer from '#transformers/app_transformer'

export default class HomeController {
  async show({ inertia }: HttpContext) {
    const query = await Apps.load()
    const apps = AppTransformer.transform(query.all())

    return inertia.render('home', {
      apps: inertia.always(apps),
    })
  }
}
