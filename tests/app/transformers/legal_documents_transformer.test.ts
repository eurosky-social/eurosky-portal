import assert from 'node:assert/strict'
import test from 'node:test'
import type { Root } from 'hast'
import { DateTime } from 'luxon'
import LegalDocumentsTransformer from '#transformers/legal_documents_transformer'

test('LegalDocumentsTransformer', function () {
  test('should use the trees of documents', function () {
    const privacy: Root = { children: [], type: 'root' }
    const terms: Root = { children: [{ type: 'text', value: 'b' }], type: 'root' }
    const effectiveAt = DateTime.fromMillis(0)
    const result = new LegalDocumentsTransformer({
      privacy: { effectiveAt, tree: privacy },
      terms: { effectiveAt, tree: terms },
    }).toObject()

    assert.deepEqual(result, { privacy, terms })
  })
})
