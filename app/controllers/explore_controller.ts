import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { defaultLocale, isLocale } from '#shared/locale'

export default class ExploreController {
  async learnMore({ i18n, inertia, view }: HttpContext) {
    const locale = isLocale(i18n.locale) ? i18n.locale : defaultLocale
    const renderedHtml = await view.render('markdown', {
      document: app.makePath('data', locale, 'explore.md'),
    })

    return inertia.render('explore/learn-more', { document: renderedHtml })
  }
}
