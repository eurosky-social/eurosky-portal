import assert from 'node:assert/strict'
import test from 'node:test'
import { segment } from '#utils/facets'

test('segment', function () {
  test('should return nothing for empty text', function () {
    const result = segment('', [{ index: { byteEnd: 1, byteStart: 0 } }])

    assert.deepEqual(result, [])
  })

  test('should return one segment without facets', function () {
    const result = segment('a', undefined)

    assert.deepEqual(result, [{ facets: [], text: 'a' }])
  })

  test('should return one segment with empty facets', function () {
    const result = segment('a', [])

    assert.deepEqual(result, [{ facets: [], text: 'a' }])
  })

  test('should split around a facet', function () {
    const facet = { index: { byteEnd: 2, byteStart: 1 } }
    const result = segment('abc', [facet])

    assert.deepEqual(result, [
      { facets: [], text: 'a' },
      { facets: [facet], text: 'b' },
      { facets: [], text: 'c' },
    ])
  })

  test('should use byte offsets, not string offsets', function () {
    // `é` is 2 bytes in UTF-8, `🇪🇺` 8.
    const facet = { index: { byteEnd: 10, byteStart: 2 } }
    const result = segment('é🇪🇺a', [facet])

    assert.deepEqual(result, [
      { facets: [], text: 'é' },
      { facets: [facet], text: '🇪🇺' },
      { facets: [], text: 'a' },
    ])
  })

  test('should support overlapping facets', function () {
    const a = { index: { byteEnd: 2, byteStart: 0 } }
    const b = { index: { byteEnd: 3, byteStart: 1 } }
    const result = segment('abc', [a, b])

    assert.deepEqual(result, [
      { facets: [a], text: 'a' },
      { facets: [a, b], text: 'b' },
      { facets: [b], text: 'c' },
    ])
  })

  test('should support facets past the end', function () {
    const facet = { index: { byteEnd: 9, byteStart: 1 } }
    const result = segment('ab', [facet])

    assert.deepEqual(result, [
      { facets: [], text: 'a' },
      { facets: [facet], text: 'b' },
    ])
  })
})
