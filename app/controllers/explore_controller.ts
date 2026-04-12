import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export default class ExploreController {
  async learnMore({ inertia, view }: HttpContext) {
    const renderedHtml = await view.render('markdown', {
      document: app.makePath('data', 'explore.md'),
    })

    return inertia.render('explore/learn-more', { document: renderedHtml })
  }
}
