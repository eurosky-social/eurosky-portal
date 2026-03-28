import type { App } from '#collections/apps'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class AppTransformer extends BaseTransformer<App> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'name',
      'url',
      'icon',
      'summary',
      'madeInEU',
      'platforms',
    ])
  }
}
