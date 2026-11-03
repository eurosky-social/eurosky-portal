import assert from 'node:assert/strict'
import test from 'node:test'
import type { App } from '#services/atstore_service'
import AppsTransformer from '#transformers/apps_transformer'

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
const social: App = {
  atUri: 'at://did:web:a.com/fyi.atstore.listing.detail/b',
  category: 'apps.category.social',
  listing: { ...listing, name: 'Zeta' },
}
const otherSocial: App = {
  atUri: 'at://did:web:a.com/fyi.atstore.listing.detail/c',
  category: 'apps.category.social',
  listing: { ...listing, name: 'Alpha' },
}
const events: App = {
  atUri: 'at://did:web:a.com/fyi.atstore.listing.detail/d',
  category: 'apps.category.events',
  listing: { ...listing, name: 'Beta' },
}
const hidden: App = {
  atUri: 'at://did:web:a.com/fyi.atstore.listing.detail/e',
  listing: { ...listing, name: 'Gamma' },
}

test('AppsTransformer', function () {
  test('should sort categories', function () {
    const { sections } = new AppsTransformer({ apps: [social, events] }).toObject()
    const result = sections.map(function (section) {
      return section.category
    })

    assert.deepEqual(result, ['apps.category.events', 'apps.category.social'])
  })

  test('should sort apps by name', function () {
    const { sections } = new AppsTransformer({ apps: [social, otherSocial] }).toObject()
    const result = sections.at(0)?.apps.map(function (d) {
      return d.listing.name
    })

    assert.deepEqual(result, ['Alpha', 'Zeta'])
  })

  test('should not include apps without category', function () {
    const { sections } = new AppsTransformer({ apps: [social, hidden] }).toObject()
    const result = sections.flatMap(function (section) {
      return section.apps.map(function (d) {
        return d.rkey
      })
    })

    assert.deepEqual(result, ['b'])
  })

  test('should list recommended apps first', function () {
    const { sections } = new AppsTransformer({
      apps: [events, { ...social, recommended: true }],
    }).toObject()
    const result = sections.at(0)?.category

    assert.equal(result, 'apps.category.recommended')
  })

  test('should not have a recommended section without recommendations', function () {
    const { sections } = new AppsTransformer({ apps: [social] }).toObject()
    const result = sections.map(function (section) {
      return section.category
    })

    assert.deepEqual(result, ['apps.category.social'])
  })
})
