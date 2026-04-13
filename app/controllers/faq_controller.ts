import type { HttpContext } from '@adonisjs/core/http'
import FAQ from '#collections/faq'

export default class FaqController {
  async show({ inertia, view }: HttpContext) {
    const query = await FAQ.load()
    const entries = await Promise.all(
      query.all().map(async (entry) => {
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
