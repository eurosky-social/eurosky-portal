import { randomUUID } from 'node:crypto'
import testUtils from '@adonisjs/core/services/test_utils'
import { parse as parseTid } from '@atcute/tid'
import { isValidTid } from '@atproto/syntax'
import { test } from '@japa/runner'
import sharp, { type Sharp } from 'sharp'
import * as lexicon from '#lexicons/index'
import oauth2Service from '#services/oauth2_service'
import { testEnv } from '../env.ts'
import { type FakePds, restorePds, signIn } from './helpers.ts'

// See `tests/env.ts`.
const clientId = testEnv.OAUTH2_CLIENT_ID
const did = testEnv.OAUTH2_ALLOWED_DIDS
const redirectUri = testEnv.OAUTH2_CLIENT_REDIRECT_URIS

const url = new URL('/_dtp/media', testEnv.APP_URL)

/**
 * Photos (PNG, 10 by 20 pixels).
 */
const red = await rectangle('#ff0000').png().toBuffer()
const blue = await rectangle('#0000ff').png().toBuffer()

/**
 * Metadata of a photo.
 */
const photo = {
  '@type': 'GenericPayload',
  'apiVersion': '0.1.0',
  'payload': {
    '@type': 'Photo',
    'albumId': 'a',
    'description': 'b',
    'favoriteInfo': null,
    'name': 'c.png',
    'uploadedTime': '2020-02-01T10:00:00Z',
  },
  'schemaSource': 'https://github.com/dtinit/data-transfer-project',
}

test.group('dtp / POST /_dtp/media', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })
  group.each.teardown(restorePds)

  test('should be `invalid_token` without a token', async function ({ assert }) {
    const response = await fetch(url, { method: 'POST' })

    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), { error: 'invalid_token' })
  })

  test('should be `invalid_token` with an unknown token', async function ({ assert }) {
    const response = await send('a', multipart(photo, 'image/png', red))

    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), { error: 'invalid_token' })
  })

  test('should be `session_invalidated` when disconnected', async function ({ assert }) {
    await signIn({ did })
    const token = await connect()
    await oauth2Service.disconnect(did, clientId)
    const response = await send(token, multipart(photo, 'image/png', red))

    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), { error: 'session_invalidated' })
  })

  test('should import a photo as a post', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    const response = await send(token, multipart(photo, 'image/png', red))
    const [record] = pds.records
    const post = getPost(pds)
    const [image] = getImages(post)

    assert.equal(response.status, 201)
    assert.deepEqual(pds.blobs[0]?.data, new Uint8Array(red))
    assert.equal(record?.collection, 'app.bsky.feed.post')
    assert.equal(record?.repo, did)
    assert.isTrue(isValidTid(record?.rkey))
    assert.equal(post.createdAt, '2020-02-01T10:00:00.000Z')
    assert.equal(post.text, 'b')
    assert.equal(image?.alt, '')
    assert.deepEqual(image?.aspectRatio, { height: 20, width: 10 })
    assert.equal(image?.image.mimeType, 'image/png')
  })

  test('should put the same photo in the same record', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    await send(token, multipart(photo, 'image/png', red))
    await send(token, multipart(photo, 'image/png', red))

    assert.equal(pds.records.length, 2)
    assert.equal(pds.records[0]?.rkey, pds.records[1]?.rkey)
  })

  test('should put other photos in other records', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    await send(token, multipart(photo, 'image/png', red))
    await send(token, multipart(photo, 'image/png', blue))

    assert.notEqual(pds.records[0]?.rkey, pds.records[1]?.rkey)
  })

  test('should truncate long captions', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    const description = '👋🏽'.repeat(301)
    const metadata = { ...photo, payload: { ...photo.payload, description } }
    await send(token, multipart(metadata, 'image/png', red))
    const { text } = getPost(pds)

    assert.equal([...new Intl.Segmenter().segment(text)].length, 300)
    assert.isTrue(text.endsWith('👋🏽…'))
  })

  test('should use the current time without an upload time', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    const metadata = { ...photo, payload: { ...photo.payload, uploadedTime: null } }
    const before = Date.now()
    await send(token, multipart(metadata, 'image/png', red))
    const createdAt = Date.parse(getPost(pds).createdAt)

    assert.isAtLeast(createdAt, before - 1000)
    assert.isAtMost(createdAt, Date.now())
  })

  test('should key posts by when photos were uploaded', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    await send(token, multipart(photo, 'image/png', red))
    const { timestamp } = parseTid(pds.records[0]?.rkey ?? '')

    assert.equal(timestamp, Date.parse(photo.payload.uploadedTime) * 1000)
  })

  test('should support upload times with an offset', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    const uploadedTime = '2020-02-01T11:00:00+01:00'
    const metadata = { ...photo, payload: { ...photo.payload, uploadedTime } }
    await send(token, multipart(metadata, 'image/png', red))

    assert.equal(getPost(pds).createdAt, '2020-02-01T10:00:00.000Z')
  })

  test('should use the current time for invalid upload times', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    const metadata = { ...photo, payload: { ...photo.payload, uploadedTime: 'a' } }
    const before = Date.now()
    await send(token, multipart(metadata, 'image/png', red))

    assert.isAtLeast(Date.parse(getPost(pds).createdAt), before - 1000)
  })

  test('should not support photos without a file', async function ({ assert }) {
    await signIn({ did })
    const token = await connect()
    const { body, contentType } = multipart(photo, 'image/png', red)
    const boundary = contentType.split('boundary=')[1] ?? ''
    // Only the first part: the metadata.
    const metadataOnly =
      body.toString('latin1').split(`\r\n--${boundary}\r\n`)[0] + `\r\n--${boundary}--`
    const response = await send(token, { body: Buffer.from(metadataOnly, 'latin1'), contentType })

    assert.equal(response.status, 400)
    assert.containSubset(await response.json(), {
      error_description: 'Expected metadata and a file',
    })
  })

  test('should not support multipart without parts', async function ({ assert }) {
    await signIn({ did })
    const token = await connect()
    const contentType = 'multipart/related; boundary=a'
    const response = await send(token, { body: Buffer.from('--a--\r\n'), contentType })

    assert.equal(response.status, 400)
  })

  test('should not support more than two parts', async function ({ assert }) {
    await signIn({ did })
    const token = await connect()
    const { body, contentType } = multipart(photo, 'image/png', red)
    const boundary = contentType.split('boundary=')[1] ?? ''
    const extra = `\r\n--${boundary}\r\nContent-Type: text/plain\r\n\r\nb\r\n--${boundary}--\r\n`
    const threeParts = body.toString('latin1').replace(`\r\n--${boundary}--\r\n`, extra)
    const response = await send(token, { body: Buffer.from(threeParts, 'latin1'), contentType })

    assert.equal(response.status, 400)
  })

  test('should ignore albums', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    const album = { ...photo, payload: { '@type': 'Album', 'id': 'a', 'name': 'b' } }
    const response = await send(token, {
      body: Buffer.from(JSON.stringify(album)),
      contentType: 'application/json',
    })

    assert.equal(response.status, 200)
    assert.deepEqual(pds.records, [])
  })

  test('should convert other images to JPEG', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    const data = await rectangle('#ff0000').avif().toBuffer()
    const response = await send(token, multipart(photo, 'image/avif', data))

    assert.equal(response.status, 201)
    assert.equal(pds.blobs[0]?.mimeType, 'image/jpeg')
  })

  test('should not support other `apiVersion`s', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    const metadata = { ...photo, apiVersion: '0.2.0' }
    const response = await send(token, multipart(metadata, 'image/png', red))

    assert.equal(response.status, 400)
    assert.containSubset(await response.json(), { error_description: 'Unsupported `apiVersion`' })
    assert.deepEqual(pds.records, [])
  })

  test('should not support videos', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    const video = { ...photo, payload: { ...photo.payload, '@type': 'Video' } }
    const response = await send(token, multipart(video, 'video/mp4', Buffer.from('a')))

    assert.equal(response.status, 400)
    assert.deepEqual(pds.records, [])
  })

  test('should not support other files', async function ({ assert }) {
    await signIn({ did })
    const token = await connect()
    const response = await send(token, multipart(photo, 'text/plain', Buffer.from('a')))

    assert.equal(response.status, 400)
    assert.containSubset(await response.json(), { error: 'invalid_request' })
  })

  test('should make images over 2 MB smaller', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    // Noise compresses badly: this is a bit over 2 MB.
    const data = await sharp({
      create: {
        background: '#000000',
        channels: 3,
        height: 600,
        noise: { mean: 128, sigma: 64, type: 'gaussian' },
        width: 1200,
      },
    })
      .png()
      .toBuffer()
    const response = await send(token, multipart(photo, 'image/png', data))
    const [blob] = pds.blobs

    assert.isAbove(data.byteLength, 2_000_000)
    assert.equal(response.status, 201)
    assert.equal(blob?.mimeType, 'image/jpeg')
    assert.isAtMost(blob?.data.byteLength ?? Infinity, 2_000_000)
    assert.deepEqual(getImages(getPost(pds))[0]?.aspectRatio, { height: 600, width: 1200 })
  })

  test('should not support unreadable images', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    const response = await send(token, multipart(photo, 'image/png', Buffer.from('a')))

    assert.equal(response.status, 400)
    assert.deepEqual(pds.blobs, [])
  })

  test('should not support invalid metadata', async function ({ assert }) {
    await signIn({ did })
    const token = await connect()
    const response = await send(token, multipart({ a: 'b' }, 'image/png', red))

    assert.equal(response.status, 400)
  })

  test('should not support other bodies', async function ({ assert }) {
    await signIn({ did })
    const token = await connect()
    const response = await send(token, { body: Buffer.from('a'), contentType: 'text/plain' })

    assert.equal(response.status, 400)
  })

  test('should import photos without a caption', async function ({ assert }) {
    const pds = await signIn({ did })
    const token = await connect()
    const metadata = { ...photo, payload: { ...photo.payload, description: null } }
    await send(token, multipart(metadata, 'image/png', red))

    assert.equal(getPost(pds).text, '')
  })

  test('should not support bodies over 20 MB', async function ({ assert }) {
    await signIn({ did })
    const token = await connect()
    const response = await send(token, multipart(photo, 'image/png', Buffer.alloc(20_000_001)))

    assert.equal(response.status, 413)
  })

  test('should not support metadata that is not JSON', async function ({ assert }) {
    await signIn({ did })
    const token = await connect()
    const { body, contentType } = multipart(photo, 'image/png', red)
    const response = await send(token, {
      body: Buffer.from(body.toString('latin1').replace('{"@type"', '{,"@type"'), 'latin1'),
      contentType,
    })

    assert.equal(response.status, 400)
  })

  test('should not support a missing content type', async function ({ assert }) {
    await signIn({ did })
    const token = await connect()
    const response = await fetch(url, {
      body: new Uint8Array([97]),
      headers: { authorization: 'Bearer ' + token },
      method: 'POST',
    })

    assert.equal(response.status, 400)
  })

  test('should fail when the PDS fails', async function ({ assert }) {
    const pds = await signIn({ did })
    pds.xrpcFails = true
    const token = await connect()
    const response = await send(token, multipart(photo, 'image/png', red))

    assert.equal(response.status, 500)
    assert.deepEqual(await response.json(), { error: 'server_error' })
  })
})

/**
 * Connect, as if the person agreed and the client exchanged the code.
 */
async function connect(): Promise<string> {
  const code = await oauth2Service.issueCode({ clientId, did, redirectUri, scope: 'a' })
  const client = oauth2Service.getClient()
  if (!client) throw new Error('Expected a client')
  const tokens = await oauth2Service.exchangeCode({ client, code, redirectUri })
  if ('error' in tokens) throw new Error('Expected tokens')
  return tokens.access_token
}

/**
 * Get the images of a post.
 */
function getImages(
  post: lexicon.app.bsky.feed.post.Main
): Array<lexicon.app.bsky.embed.images.Image> {
  const { embed } = post

  if (!embed || !lexicon.app.bsky.embed.images.main.isTypeOf(embed)) {
    throw new Error('Expected images')
  }

  return embed.images
}

/**
 * Get a post put in the fake PDS, checked against the lexicon.
 */
function getPost(pds: FakePds, index = 0): lexicon.app.bsky.feed.post.Main {
  return lexicon.app.bsky.feed.post.main.parse(pds.records[index]?.record)
}

/**
 * Create a plain image, 10 by 20 pixels.
 */
function rectangle(color: string): Sharp {
  return sharp({ create: { background: color, channels: 3, height: 20, width: 10 } })
}

/**
 * Create a `multipart/related` body as DTP does (OkHttp): JSON metadata and
 * a file, as unnamed parts.
 */
function multipart(
  metadata: object,
  type: string,
  data: Buffer
): { body: Buffer; contentType: string } {
  const boundary = randomUUID()
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json\r\n\r\n`),
    Buffer.from(JSON.stringify(metadata)),
    Buffer.from(
      `\r\n--${boundary}\r\nContent-Type: ${type}\r\nContent-Length: ${data.byteLength}\r\n\r\n`
    ),
    data,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])
  return { body, contentType: `multipart/related; boundary=${boundary}` }
}

/**
 * Send a request to the endpoint.
 */
function send(token: string, request: { body: Buffer; contentType: string }): Promise<Response> {
  return fetch(url, {
    body: request.body,
    headers: { 'authorization': 'Bearer ' + token, 'content-type': request.contentType },
    method: 'POST',
  })
}
