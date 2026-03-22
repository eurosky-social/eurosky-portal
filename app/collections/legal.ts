import vine from '@vinejs/vine'
import app from '@adonisjs/core/services/app'
import { Collection } from '@adonisjs/content'
import { loaders } from '@adonisjs/content/loaders'

export default Collection.create({
  schema: vine.array(
    vine.object({
      name: vine.enum(['terms', 'privacy']),
      filename: vine.string(),
      updatedAt: vine.date({ formats: ['YYYY-MM-DD'] }),
    })
  ),
  loader: loaders.jsonLoader(app.makePath('data', 'legal.json')),
  cache: true,
  views: {
    findByName(data, name: string) {
      return data.find((document) => document.name === name)
    },
  },
})
