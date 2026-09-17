import { BaseTransformer } from '@adonisjs/core/transformers'
import type { JSONDataTypes } from '@adonisjs/core/types/transformers'
import type { LegalDocumentName, LegalDocument } from '#services/legal_service'

export default class LegalDocumentsTransformer extends BaseTransformer<
  Record<LegalDocumentName, LegalDocument>
> {
  toObject() {
    return {
      terms: this.resource.terms.tree as unknown as JSONDataTypes,
      privacy: this.resource.privacy.tree as unknown as JSONDataTypes,
    }
  }
}
