import { BaseTransformer } from '@adonisjs/core/transformers'
import type { Root } from 'hast'
import type { LegalDocumentName, LegalDocument } from '#services/legal_service'
import type { Jsonify } from '#shared/json'

export default class LegalDocumentsTransformer extends BaseTransformer<
  Record<LegalDocumentName, LegalDocument>
> {
  toObject(): Record<LegalDocumentName, Jsonify<Root>> {
    return {
      terms: this.resource.terms.tree,
      privacy: this.resource.privacy.tree,
    }
  }
}
