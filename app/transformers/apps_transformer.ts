import { BaseTransformer } from '@adonisjs/core/transformers'
import type { App } from '#services/atstore_service'
import AppTransformer from '#transformers/app_transformer'

export default class AppsTransformer extends BaseTransformer<{
  gettingStarted: App[]
  exploreMore: App[]
  forWork: App[]
}> {
  toObject() {
    return {
      gettingStarted: AppTransformer.transform(this.resource.gettingStarted),
      exploreMore: AppTransformer.transform(this.resource.exploreMore),
      forWork: AppTransformer.transform(this.resource.forWork),
    }
  }
}
