import assert from 'node:assert/strict'
import test from 'node:test'
import sharp, { type Sharp } from 'sharp'
import { fitImage, ImageError, isImageType } from '#utils/image'

const options = { maxSize: 2_000, types: ['image/jpeg', 'image/png'] } as const

test('fitImage', function () {
  test('should keep images that fit, with their aspect ratio', async function () {
    const data = await rectangle(10, 20).png().toBuffer()
    const result = await fitImage(data, 'image/png', options)

    assert.deepEqual(result, {
      aspectRatio: { height: 20, width: 10 },
      data,
      mimeType: 'image/png',
    })
  })

  test('should use the aspect ratio as shown', async function () {
    // Stored landscape, shown portrait (orientation `6`: turn 90° clockwise).
    const data = await rectangle(20, 10).jpeg().withMetadata({ orientation: 6 }).toBuffer()
    const result = await fitImage(data, 'image/jpeg', options)

    assert.deepEqual(result.aspectRatio, { height: 20, width: 10 })
  })

  test('should convert other types to JPEG', async function () {
    const data = await rectangle(10, 20).avif().toBuffer()
    const result = await fitImage(data, 'image/avif', options)
    const metadata = await sharp(result.data).metadata()

    assert.equal(result.mimeType, 'image/jpeg')
    assert.equal(metadata.format, 'jpeg')
    assert.deepEqual(result.aspectRatio, { height: 20, width: 10 })
  })

  test('should make large images smaller, as JPEG', async function () {
    const data = await noise(80, 60).png().toBuffer()
    const result = await fitImage(data, 'image/png', options)

    assert.ok(data.byteLength > options.maxSize)
    assert.ok(result.data.byteLength <= options.maxSize)
    assert.equal(result.mimeType, 'image/jpeg')
    assert.ok(result.aspectRatio.width < 80)
    assert.ok(Math.abs(result.aspectRatio.width / result.aspectRatio.height - 4 / 3) < 0.05)
  })

  test('should store pixels as shown when making images smaller', async function () {
    const data = await noise(80, 60)
      .jpeg({ quality: 100 })
      .withMetadata({ orientation: 6 })
      .toBuffer()
    const result = await fitImage(data, 'image/jpeg', options)
    const metadata = await sharp(result.data).metadata()

    assert.ok([undefined, 1].includes(metadata.orientation))
    assert.ok((metadata.width ?? 0) < (metadata.height ?? 0))
  })

  test('should keep metadata when making images smaller', async function () {
    const data = await noise(80, 60)
      .png()
      .withExif({ IFD0: { Copyright: 'eurosky-test' } })
      .toBuffer()
    const result = await fitImage(data, 'image/png', options)

    assert.ok(Buffer.from(result.data).includes('eurosky-test'))
  })

  test('should throw for images that cannot be read', async function () {
    await assert.rejects(fitImage(Buffer.from('a'), 'image/png', options), ImageError)
  })

  test('should throw for images that cannot be made small enough', async function () {
    const data = await noise(80, 60).png().toBuffer()

    await assert.rejects(fitImage(data, 'image/png', { ...options, maxSize: 1 }), ImageError)
  })
})

test('isImageType', function () {
  test('should support image types', function () {
    assert.equal(isImageType('image/svg+xml'), true)
  })

  test('should not support other types', function () {
    assert.equal(isImageType('video/mp4'), false)
  })

  test('should not support parameters', function () {
    assert.equal(isImageType('image/png; a=b'), false)
  })
})

/**
 * Create an image of noise, which compresses badly.
 */
function noise(width: number, height: number): Sharp {
  return sharp({
    create: {
      background: '#000000',
      channels: 3,
      height,
      noise: { mean: 128, sigma: 64, type: 'gaussian' },
      width,
    },
  })
}

/**
 * Create a plain image.
 */
function rectangle(width: number, height: number): Sharp {
  return sharp({ create: { background: '#ff0000', channels: 3, height, width } })
}
