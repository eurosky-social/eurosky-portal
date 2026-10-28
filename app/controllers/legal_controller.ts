import type { HttpContext } from '@adonisjs/core/http'
import { links } from '#shared/links'
import { defaultLocale, isLocale } from '#shared/locale'
import { legalValidator } from '#validators/legal'

export default class LegalController {
  async show({ i18n, request, response }: HttpContext) {
    const { params } = await request.validateUsing(legalValidator)
    const locale = isLocale(i18n.locale) ? i18n.locale : defaultLocale
    return response.redirect().status(301).toPath(links[params.document](locale))
  }
}
