import type { HttpContext } from '@adonisjs/core/http'
import type { Nodes } from 'hast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toHast } from 'mdast-util-to-hast'
import FAQ from '#collections/faq'
import type { Jsonify } from '#shared/json'
import { defaultLocale, isLocale } from '#shared/locale'

/**
 * Entry of the FAQ.
 */
interface FaqEntry {
  /**
   * Answer, as markdown converted to hast nodes.
   */
  answer: Nodes

  /**
   * Question.
   */
  question: string
}

export default class FaqController {
  async show({ i18n, inertia }: HttpContext) {
    const locale = isLocale(i18n.locale) ? i18n.locale : defaultLocale
    const query = await FAQ.load()
    const entries = query[locale].all().map(function (entry): Jsonify<FaqEntry> {
      return { answer: toHast(fromMarkdown(entry.answer)), question: entry.question }
    })

    return inertia.render('faq/show', {
      faq: inertia.always(entries),
    })
  }
}
