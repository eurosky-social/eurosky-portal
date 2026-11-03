import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isImageMimeType,
  isKnownMimeType,
  isVideoMimeType,
  mediaType,
  normalizeMimeType,
} from '#shared/mime'

test('isImageMimeType', function () {
  test('should support images', function () {
    const result = isImageMimeType('image/png')

    assert.equal(result, true)
  })

  test('should not support videos', function () {
    const result = isImageMimeType('video/mp4')

    assert.equal(result, false)
  })
})

test('isKnownMimeType', function () {
  test('should support images', function () {
    const result = isKnownMimeType('image/png')

    assert.equal(result, true)
  })

  test('should support videos', function () {
    const result = isKnownMimeType('video/mp4')

    assert.equal(result, true)
  })

  test('should not support other types', function () {
    const result = isKnownMimeType('image/svg+xml')

    assert.equal(result, false)
  })
})

test('isVideoMimeType', function () {
  test('should support videos', function () {
    const result = isVideoMimeType('video/mp4')

    assert.equal(result, true)
  })

  test('should not support images', function () {
    const result = isVideoMimeType('image/png')

    assert.equal(result, false)
  })
})

test('mediaType', function () {
  test('should support images', function () {
    const result = mediaType('image/webp')

    assert.equal(result, 'image')
  })

  test('should support videos', function () {
    const result = mediaType('video/webm')

    assert.equal(result, 'video')
  })

  test('should use `other` for other types', function () {
    const result = mediaType('image/svg+xml')

    assert.equal(result, 'other')
  })
})

test('normalizeMimeType', function () {
  test('should lowercase and drop parameters', function () {
    const result = normalizeMimeType('Image/PNG; a=b')

    assert.equal(result, 'image/png')
  })

  test('should trim', function () {
    const result = normalizeMimeType(' video/mp4 ')

    assert.equal(result, 'video/mp4')
  })

  for (const value of [undefined, null, '', ';']) {
    test(`should default for \`${value}\``, function () {
      const result = normalizeMimeType(value)

      assert.equal(result, 'application/octet-stream')
    })
  }
})
