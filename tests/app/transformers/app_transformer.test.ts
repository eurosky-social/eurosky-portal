import assert from 'node:assert/strict'
import test from 'node:test'
import type { App } from '#services/atstore_service'
import AppTransformer from '#transformers/app_transformer'

const listing = {
  appTags: [],
  categorySlug: null,
  description: 'a',
  heroImageUrl: null,
  iconUrl: null,
  name: 'b',
  rating: null,
  reviewCount: 0,
  tagline: 'c',
}

test('AppTransformer', function () {
  test('should pick fields and add `rkey`', function () {
    const app: App = {
      atUri: 'at://did:web:a.com/fyi.atstore.listing.detail/d',
      category: 'apps.category.social',
      externalUrl: 'https://e.com',
      listing,
      madeInEurope: false,
    }
    const result = new AppTransformer(app).toObject()

    assert.deepEqual(result, {
      atUri: 'at://did:web:a.com/fyi.atstore.listing.detail/d',
      externalUrl: 'https://e.com',
      listing,
      madeInEurope: false,
      rkey: 'd',
    })
  })
})
