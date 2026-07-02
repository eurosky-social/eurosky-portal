import type { App } from '#services/atstore_service'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class AppTransformer extends BaseTransformer<App> {
  toObject() {
    return this.pick(this.resource, ['atUri', 'externalUrl', 'listing', 'madeInEurope'])
  }
}
