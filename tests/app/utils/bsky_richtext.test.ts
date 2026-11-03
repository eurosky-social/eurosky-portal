import assert from 'node:assert/strict'
import test from 'node:test'
import { toHast } from '#utils/bsky_richtext'

const index = { byteEnd: 1, byteStart: 0 }

test('toHast', function () {
  test('should support text', function () {
    const result = toHast('a', undefined)

    assert.deepEqual(result, [{ type: 'text', value: 'a' }])
  })

  test('should support links', function () {
    const result = toHast('ab', [
      { features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'https://c.com' }], index },
    ])

    assert.deepEqual(result, [
      {
        children: [{ type: 'text', value: 'a' }],
        properties: { href: 'https://c.com' },
        tagName: 'a',
        type: 'element',
      },
      { type: 'text', value: 'b' },
    ])
  })

  test('should not link unsafe protocols', function () {
    const result = toHast('a', [
      { features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'javascript:b()' }], index },
    ])

    assert.deepEqual(result, [{ type: 'text', value: 'a' }])
  })

  test('should link mentions to Bluesky', function () {
    const result = toHast('a', [
      { features: [{ $type: 'app.bsky.richtext.facet#mention', did: 'did:web:b.com' }], index },
    ])

    assert.deepEqual(result, [
      {
        children: [{ type: 'text', value: 'a' }],
        properties: { href: 'https://bsky.app/profile/did:web:b.com' },
        tagName: 'a',
        type: 'element',
      },
    ])
  })

  test('should link tags to Bluesky, encoded', function () {
    const result = toHast('a', [
      { features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'b/c' }], index },
    ])

    assert.deepEqual(result, [
      {
        children: [{ type: 'text', value: 'a' }],
        properties: { href: 'https://bsky.app/hashtag/b%2Fc' },
        tagName: 'a',
        type: 'element',
      },
    ])
  })

  test('should link once when features overlap', function () {
    const result = toHast('a', [
      {
        features: [
          { $type: 'app.bsky.richtext.facet#link', uri: 'https://b.com' },
          { $type: 'app.bsky.richtext.facet#tag', tag: 'c' },
        ],
        index,
      },
    ])

    assert.deepEqual(result, [
      {
        children: [{ type: 'text', value: 'a' }],
        properties: { href: 'https://b.com' },
        tagName: 'a',
        type: 'element',
      },
    ])
  })
})
