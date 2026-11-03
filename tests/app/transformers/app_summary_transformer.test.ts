import assert from 'node:assert/strict'
import test from 'node:test'
import type { App } from '#services/atstore_service'
import AppSummaryTransformer from '#transformers/app_summary_transformer'

test('AppSummaryTransformer', function () {
  test('should pick summary fields and add `rkey`', function () {
    const app: App = {
      atUri: 'at://did:web:a.com/fyi.atstore.listing.detail/b',
      externalUrl: 'https://c.com',
      listing: {
        appTags: [],
        categorySlug: null,
        description: 'd',
        heroImageUrl: null,
        iconUrl: 'e',
        name: 'f',
        rating: '1',
        reviewCount: 2,
        tagline: 'g',
      },
      madeInEurope: true,
    }
    const result = new AppSummaryTransformer(app).toObject()

    assert.deepEqual(result, {
      atUri: 'at://did:web:a.com/fyi.atstore.listing.detail/b',
      listing: { iconUrl: 'e', name: 'f', rating: '1', reviewCount: 2, tagline: 'g' },
      madeInEurope: true,
      rkey: 'b',
    })
  })
})
