import assert from 'node:assert/strict'
import test from 'node:test'
import { formatMimeType, mimeTypeExtension } from '../../../inertia/utils/mime.ts'

test('formatMimeType', function () {
  test('should translate known types', function () {
    const result = formatMimeType(function (key: string) {
      return `t:${key}`
    }, 'image/jpeg')

    assert.equal(result, 't:mimeType.jpeg')
  })

  test('should not translate unknown types', function () {
    const result = formatMimeType(function (key: string) {
      return `t:${key}`
    }, 'a/b')

    assert.equal(result, 'a/b')
  })
})

test('mimeTypeExtension', function () {
  test('should return the extension', function () {
    const result = mimeTypeExtension('image/jpeg')

    assert.equal(result, 'jpg')
  })

  test('should return extensions that differ from the subtype', function () {
    const result = mimeTypeExtension('video/ogg')

    assert.equal(result, 'ogv')
  })

  test('should not return extensions for unknown types', function () {
    const result = mimeTypeExtension('a/b')

    assert.equal(result, undefined)
  })
})
