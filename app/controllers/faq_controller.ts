import type { HttpContext } from '@adonisjs/core/http'
import FAQ from '#collections/faq'
import { defaultLocale, isLocale } from '#shared/locale'

export default class FaqController {
  async show({ i18n, inertia, view }: HttpContext) {
    const locale = isLocale(i18n.locale) ? i18n.locale : defaultLocale
    const query = await FAQ.load()
    const entries = await Promise.all(
      query[locale].all().map(async (entry) => {
        return {
          question: entry.question,
          answer: await view.render('markdown', {
            content: entry.answer,
          }),
        }
      })
    )

    return inertia.render('faq/show', {
      faq: inertia.always(entries),
    })
  }
}
