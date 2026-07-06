import type { App } from '#services/atstore_service'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { AtUri } from '@atproto/syntax'

export default class AppTransformer extends BaseTransformer<App> {
  toObject() {
    const rkey = new AtUri(this.resource.atUri).rkey
    return {
      ...this.pick(this.resource, ['atUri', 'externalUrl', 'listing', 'madeInEurope']),
      rkey,
    }
  }
}
