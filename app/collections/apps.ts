import type { Infer } from '@vinejs/vine/types'
import vine from '@vinejs/vine'
import app from '@adonisjs/core/services/app'
import { Collection } from '@adonisjs/content'
import { loaders } from '@adonisjs/content/loaders'
import '#extensions/vine.fileExists'
import path from 'node:path'

const tailwindColors = [
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
] as const

const categories = ['getting-started', 'explore-more', 'for-work'] as const
type Category = (typeof categories)[number]

const appSchema = vine.object({
  id: vine.string().alphaNumeric({ allowUnderscores: true }),
  name: vine.string(),
  icon: vine.object({
    // We're taking the path of `icons/sifa.png` converting it to
    // assets/icons/sifa.png, then resolving that relative to the `data`
    // directory, validating that the file exists, and then converting that path
    // back to a `assets/{file}` path
    path: vine
      .string()
      .parse((value) => {
        if (typeof value === 'string') {
          return path.join('assets', value)
        }
        return value
      })
      .toAbsolutePath()
      .fileExists()
      .transform((value) => {
        return path.relative(app.makePath('data'), value)
      })
      .optional(),
    fallback: vine.object({
      color: vine.enum(tailwindColors),
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
  platforms: vine.array(vine.enum(['ios', 'android', 'web'])).distinct(),
  category: vine.enum(categories),
  madeInEU: vine.boolean().optional(),
})

const Apps = Collection.create({
  schema: vine.array(appSchema),
  loader: loaders.jsonLoader(app.makePath('data', 'apps.json')),
  cache: app.inProduction,
  views: {
    findByCategory(data, category: Category) {
      return data.filter((application) => application.category === category)
    },
  },
})

export type App = Infer<typeof appSchema>
export default Apps
