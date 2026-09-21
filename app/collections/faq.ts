import type { Infer } from '@vinejs/vine/types'
import vine from '@vinejs/vine'
import app from '@adonisjs/core/services/app'
import { Collection } from '@adonisjs/content'
import { loaders } from '@adonisjs/content/loaders'
import { locales } from '#shared/locale'

const faqSchema = vine.object({
  question: vine.string(),
  answer: vine.string(),
})

const Faq = Collection.multi([...locales], (locale) =>
  Collection.create({
    schema: vine.array(faqSchema),
    loader: loaders.jsonLoader(app.makePath('data', locale, 'faq.json')),
    cache: app.inProduction,
  })
)

export type FAQ = Infer<typeof faqSchema>
export default Faq
