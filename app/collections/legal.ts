import vine from '@vinejs/vine'
import app from '@adonisjs/core/services/app'
import { Collection } from '@adonisjs/content'
import { loaders } from '@adonisjs/content/loaders'

const LegalDocuments = Collection.create({
  schema: vine.array(
    vine.object({
      name: vine.enum(['terms', 'privacy']),
      title: vine.string(),
      filename: vine.string(),
      updatedAt: vine.date({ formats: ['YYYY-MM-DD'] }),
    })
  ),
  loader: loaders.jsonLoader(app.makePath('data', 'legal.json')),
  cache: app.inProduction,
  views: {
    findByName(data, name: string) {
      return data.find((document) => document.name === name)
    },
  },
})

export default LegalDocuments
