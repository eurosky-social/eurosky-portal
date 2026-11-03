import assert from 'node:assert/strict'
import test from 'node:test'
import { toHast } from '#utils/leaflet_richtext'

const index = { byteEnd: 1, byteStart: 0 }

test('toHast', function () {
  test('should support text', function () {
    const result = toHast('a', undefined)

    assert.deepEqual(result, [{ type: 'text', value: 'a' }])
  })

  for (const [name, tagName] of [
    ['bold', 'strong'],
    ['code', 'code'],
    ['highlight', 'mark'],
    ['italic', 'em'],
    ['strikethrough', 'del'],
    ['underline', 'u'],
  ] as const) {
    test(`should turn \`${name}\` into \`<${tagName}>\``, function () {
      const result = toHast('a', [
        { features: [{ $type: `pub.leaflet.richtext.facet#${name}` }], index },
      ])

      assert.deepEqual(result, [
        { children: [{ type: 'text', value: 'a' }], properties: {}, tagName, type: 'element' },
      ])
    })
  }

  test('should nest formatting', function () {
    const result = toHast('a', [
      {
        features: [
          { $type: 'pub.leaflet.richtext.facet#bold' },
          { $type: 'pub.leaflet.richtext.facet#italic' },
        ],
        index,
      },
    ])

    assert.deepEqual(result, [
      {
        children: [
          {
            children: [{ type: 'text', value: 'a' }],
            properties: {},
            tagName: 'strong',
            type: 'element',
          },
        ],
        properties: {},
        tagName: 'em',
        type: 'element',
      },
    ])
  })

  test('should support links', function () {
    const result = toHast('a', [
      { features: [{ $type: 'pub.leaflet.richtext.facet#link', uri: 'https://b.com' }], index },
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

  test('should not link unsafe protocols', function () {
    const result = toHast('a', [
      { features: [{ $type: 'pub.leaflet.richtext.facet#link', uri: 'javascript:b()' }], index },
    ])

    assert.deepEqual(result, [{ type: 'text', value: 'a' }])
  })
})
