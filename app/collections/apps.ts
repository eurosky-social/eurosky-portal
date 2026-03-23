import type { Infer } from '@vinejs/vine/types'
import vine from '@vinejs/vine'
import app from '@adonisjs/core/services/app'
import { Collection } from '@adonisjs/content'
import { loaders } from '@adonisjs/content/loaders'
import '#extensions/vine.fileExists'

const appSchema = vine.object({
  id: vine.string().alphaNumeric({ allowUnderscores: true }),
  name: vine.string(),
  icon: vine.object({
    path: vine.string().toAbsolutePath().fileExists().toVitePath().optional(),
    fallback: vine.object({
      color: vine.enum([
        'red',
        'orange',
        'amber',
        'yellow',
        'lime',
        'green',
        'emerald',
        'teal',
        'cyan',
        'sky',
        'blue',
        'indigo',
        'violet',
        'purple',
        'fuchsia',
        'pink',
        'rose',
        'slate',
        'gray',
        'zinc',
        'neutral',
        'stone',
        'taupe',
        'mauve',
        'mist',
        'olive',
      ]),
      initials: vine
        .string()
        .maxLength(2)
        .minLength(1)
        .transform((str) => str.toUpperCase()),
    }),
  }),
  url: vine.string().url({
    require_protocol: true,
    disallow_auth: true,
    protocols: ['https'],
  }),
  summary: vine.string().maxLength(300),
})

const Apps = Collection.create({
  schema: vine.array(appSchema),
  loader: loaders.jsonLoader(app.makePath('data', 'apps.json')),
  cache: app.inProduction,
  // views: {
  //   findByName(data, name: string) {
  //     return data.find((document) => document.name === name)
  //   },
  // },
})

export type App = Infer<typeof appSchema>
export default Apps
