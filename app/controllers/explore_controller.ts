import type { HttpContext } from '@adonisjs/core/http'
import { links } from '#shared/links'
import { defaultLocale, isLocale } from '#shared/locale'

export default class ExploreController {
  /**
   * The explore page moved to the products page on eurosky.tech.
   */
  async learnMore({ i18n, response }: HttpContext) {
    const locale = isLocale(i18n.locale) ? i18n.locale : defaultLocale
    return response.redirect().toPath(links.products(locale))
  }
}
