import type { App } from '#services/atstore_service'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { AtUri } from '@atproto/syntax'

export default class AppSummaryTransformer extends BaseTransformer<App> {
  toObject() {
    const rkey = new AtUri(this.resource.atUri).rkey
    return {
      ...this.pick(this.resource, ['atUri', 'madeInEurope']),
      listing: this.pick(this.resource.listing, [
        'iconUrl',
        'name',
        'rating',
        'reviewCount',
        'tagline',
      ]),
      rkey,
    }
  }
}
