import { BaseTransformer } from '@adonisjs/core/transformers'

export default class LegalDocumentsTransformer extends BaseTransformer<{
  terms: string
  privacy: string
}> {
  toObject() {
    return this.resource
  }
}
