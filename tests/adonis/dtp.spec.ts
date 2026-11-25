import { randomUUID } from 'node:crypto'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { parse as parseTid } from '@atcute/tid'
import { type Client, type DidString, getBlobCidString } from '@atproto/lex'
import { AtUri } from '@atproto/syntax'
import { test } from '@japa/runner'
import sharp, { type Sharp } from 'sharp'
import * as lexicon from '#lexicons/index'
import oauth2Service from '#services/oauth2_service'
import { importScopes, serializeScopes } from '#utils/oauth'
import { testEnv } from '../env.ts'
import { oauthClient } from '../pds.ts'
import { signIn } from './helpers.ts'

// See `tests/env.ts`.
const clientId = testEnv.OAUTH2_CLIENT_ID
const redirectUri = testEnv.OAUTH2_CLIENT_REDIRECT_URIS

const url = new URL('/_dtp/media', testEnv.APP_URL)

const scope = serializeScopes(importScopes.union(new Set(['atproto'])))

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
    const { did } = await signIn({ scope })
    const token = await connect(did)
    await oauth2Service.disconnect(did, clientId)
    const response = await send(token, multipart(photo, 'image/png', red))

    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), { error: 'session_invalidated' })
  })

  test('should be `session_invalidated` without a session', async function ({ assert }) {
    const { did } = await signIn({ scope })
    const token = await connect(did)
    // Revokes on the PDS and forgets the session.
    await oauthClient().revoke(did)
    const response = await send(token, multipart(photo, 'image/png', red))

    assert.equal(response.status, 401)
    assert.containSubset(await response.json(), { error: 'session_invalidated' })
  })

  test('should be `session_invalidated` when the PDS revoked the session', async function ({
    assert,
  }) {
    const { did } = await signIn({ scope })
    const token = await connect(did)
    // Revoke on the PDS (such as when the person removes the app there), but
    // keep the session.
    const config = await app.container.make('atproto.oauth.config')
    const { sessions } = config.stores
    const session = await sessions.get(did)
    await oauthClient().revoke(did)
    if (session) await sessions.set(did, session)
    const response = await send(token, multipart(photo, 'image/png', red))

    assert.equal(response.status, 401)
    assert.containSubset(await response.json(), { error: 'session_invalidated' })
  })

  test('should import a photo as a post', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    const response = await send(token, multipart(photo, 'image/png', red))
    const post = await getPost(repo)
    const image = getImage(post)
    const blob = await repo.getBlob(did, getBlobCidString(image.image))

    assert.equal(response.status, 201)
    assert.deepEqual(blob.body, new Uint8Array(red))
    assert.equal(post.createdAt, '2020-02-01T10:00:00.000Z')
    assert.equal(post.text, 'b')
    assert.equal(image.alt, '')
    assert.deepEqual(image.aspectRatio, { height: 20, width: 10 })
    assert.equal(image.image.mimeType, 'image/png')
  })

  test('should put the same photo in the same record', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    await send(token, multipart(photo, 'image/png', red))
    await send(token, multipart(photo, 'image/png', red))
    const { records } = await repo.list(lexicon.app.bsky.feed.post.main)

    assert.lengthOf(records, 1)
  })

  test('should put other photos in other records', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    await send(token, multipart(photo, 'image/png', red))
    await send(token, multipart(photo, 'image/png', blue))
    const { records } = await repo.list(lexicon.app.bsky.feed.post.main)

    assert.lengthOf(records, 2)
  })

  test('should truncate long captions', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    const description = '👋🏽'.repeat(301)
    const metadata = { ...photo, payload: { ...photo.payload, description } }
    await send(token, multipart(metadata, 'image/png', red))
    const { text } = await getPost(repo)

    assert.equal([...new Intl.Segmenter().segment(text)].length, 300)
    assert.isTrue(text.endsWith('👋🏽…'))
  })

  test('should use the current time without an upload time', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    const metadata = { ...photo, payload: { ...photo.payload, uploadedTime: null } }
    const before = Date.now()
    await send(token, multipart(metadata, 'image/png', red))
    const post = await getPost(repo)
    const createdAt = Date.parse(post.createdAt)

    assert.isAtLeast(createdAt, before - 1000)
    assert.isAtMost(createdAt, Date.now())
  })

  test('should key posts by when photos were uploaded', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    await send(token, multipart(photo, 'image/png', red))
    const {
      records: [record],
    } = await repo.list(lexicon.app.bsky.feed.post.main)
    const { timestamp } = parseTid(new AtUri(record?.uri ?? '').rkey)

    assert.equal(timestamp, Date.parse(photo.payload.uploadedTime) * 1000)
  })

  test('should support upload times with an offset', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    const uploadedTime = '2020-02-01T11:00:00+01:00'
    const metadata = { ...photo, payload: { ...photo.payload, uploadedTime } }
    await send(token, multipart(metadata, 'image/png', red))

    const post = await getPost(repo)

    assert.equal(post.createdAt, '2020-02-01T10:00:00.000Z')
  })

  test('should use the current time for invalid upload times', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    const metadata = { ...photo, payload: { ...photo.payload, uploadedTime: 'a' } }
    const before = Date.now()
    await send(token, multipart(metadata, 'image/png', red))

    const post = await getPost(repo)

    assert.isAtLeast(Date.parse(post.createdAt), before - 1000)
  })

  test('should not support photos without a file', async function ({ assert }) {
    const { did } = await signIn({ scope })
    const token = await connect(did)
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
    const { did } = await signIn({ scope })
    const token = await connect(did)
    const contentType = 'multipart/related; boundary=a'
    const response = await send(token, { body: Buffer.from('--a--\r\n'), contentType })

    assert.equal(response.status, 400)
  })

  test('should not support more than two parts', async function ({ assert }) {
    const { did } = await signIn({ scope })
    const token = await connect(did)
    const { body, contentType } = multipart(photo, 'image/png', red)
    const boundary = contentType.split('boundary=')[1] ?? ''
    const extra = `\r\n--${boundary}\r\nContent-Type: text/plain\r\n\r\nb\r\n--${boundary}--\r\n`
    const threeParts = body.toString('latin1').replace(`\r\n--${boundary}--\r\n`, extra)
    const response = await send(token, { body: Buffer.from(threeParts, 'latin1'), contentType })

    assert.equal(response.status, 400)
  })

  test('should ignore albums', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    const album = { ...photo, payload: { '@type': 'Album', 'id': 'a', 'name': 'b' } }
    const response = await send(token, {
      body: Buffer.from(JSON.stringify(album)),
      contentType: 'application/json',
    })
    const { records } = await repo.list(lexicon.app.bsky.feed.post.main)

    assert.equal(response.status, 200)
    assert.lengthOf(records, 0)
  })

  test('should convert other images to JPEG', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    const data = await rectangle('#ff0000').avif().toBuffer()
    const response = await send(token, multipart(photo, 'image/avif', data))
    const post = await getPost(repo)

    assert.equal(response.status, 201)
    assert.equal(getImage(post).image.mimeType, 'image/jpeg')
  })

  test('should not support other `apiVersion`s', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    const metadata = { ...photo, apiVersion: '0.2.0' }
    const response = await send(token, multipart(metadata, 'image/png', red))
    const { records } = await repo.list(lexicon.app.bsky.feed.post.main)

    assert.equal(response.status, 400)
    assert.containSubset(await response.json(), { error_description: 'Unsupported `apiVersion`' })
    assert.lengthOf(records, 0)
  })

  test('should not support videos', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    const video = { ...photo, payload: { ...photo.payload, '@type': 'Video' } }
    const response = await send(token, multipart(video, 'video/mp4', Buffer.from('a')))
    const { records } = await repo.list(lexicon.app.bsky.feed.post.main)

    assert.equal(response.status, 400)
    assert.lengthOf(records, 0)
  })

  test('should not support other files', async function ({ assert }) {
    const { did } = await signIn({ scope })
    const token = await connect(did)
    const response = await send(token, multipart(photo, 'text/plain', Buffer.from('a')))

    assert.equal(response.status, 400)
    assert.containSubset(await response.json(), { error: 'invalid_request' })
  })

  test('should make images over 2 MB smaller', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
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
    const image = getImage(await getPost(repo))
    const blob = await repo.getBlob(did, getBlobCidString(image.image))

    assert.isAbove(data.byteLength, 2_000_000)
    assert.equal(response.status, 201)
    assert.equal(image.image.mimeType, 'image/jpeg')
    assert.isAtMost(blob.body.byteLength, 2_000_000)
    assert.deepEqual(image.aspectRatio, { height: 600, width: 1200 })
  })

  test('should not support unreadable images', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    const response = await send(token, multipart(photo, 'image/png', Buffer.from('a')))
    const { records } = await repo.list(lexicon.app.bsky.feed.post.main)

    assert.equal(response.status, 400)
    assert.lengthOf(records, 0)
  })

  test('should not support invalid metadata', async function ({ assert }) {
    const { did } = await signIn({ scope })
    const token = await connect(did)
    const response = await send(token, multipart({ a: 'b' }, 'image/png', red))

    assert.equal(response.status, 400)
  })

  test('should not support other bodies', async function ({ assert }) {
    const { did } = await signIn({ scope })
    const token = await connect(did)
    const response = await send(token, { body: Buffer.from('a'), contentType: 'text/plain' })

    assert.equal(response.status, 400)
  })

  test('should import photos without a caption', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    const metadata = { ...photo, payload: { ...photo.payload, description: null } }
    await send(token, multipart(metadata, 'image/png', red))

    const post = await getPost(repo)

    assert.equal(post.text, '')
  })

  test('should not support bodies over 20 MB', async function ({ assert }) {
    const { did } = await signIn({ scope })
    const token = await connect(did)
    const response = await send(token, multipart(photo, 'image/png', Buffer.alloc(20_000_001)))

    assert.equal(response.status, 413)
  })

  test('should not support metadata that is not JSON', async function ({ assert }) {
    const { did } = await signIn({ scope })
    const token = await connect(did)
    const { body, contentType } = multipart(photo, 'image/png', red)
    const response = await send(token, {
      body: Buffer.from(body.toString('latin1').replace('{"@type"', '{,"@type"'), 'latin1'),
      contentType,
    })

    assert.equal(response.status, 400)
  })

  test('should not support a missing content type', async function ({ assert }) {
    const { did } = await signIn({ scope })
    const token = await connect(did)
    const response = await fetch(url, {
      body: new Uint8Array([97]),
      headers: { authorization: 'Bearer ' + token },
      method: 'POST',
    })

    assert.equal(response.status, 400)
  })

  test('should be `server_error` when the PDS rejects writes', async function ({ assert }) {
    const { did, repo } = await signIn({ scope })
    const token = await connect(did)
    // Deactivated accounts cannot write.
    await repo.xrpc(lexicon.com.atproto.server.deactivateAccount.main, { body: {} })
    const response = await send(token, multipart(photo, 'image/png', red))

    assert.equal(response.status, 500)
    assert.deepEqual(await response.json(), { error: 'server_error' })
  })
})

/**
 * Connect, as if the person agreed and the client exchanged the code.
 */
async function connect(did: DidString): Promise<string> {
  const code = await oauth2Service.issueCode({ clientId, did, redirectUri, scope: 'a' })
  const client = oauth2Service.getClient()
  if (!client) throw new Error('Expected a client')
  const tokens = await oauth2Service.exchangeCode({ client, code, redirectUri })
  if ('error' in tokens) throw new Error('Expected tokens')
  return tokens.access_token
}

/**
 * Get the image of a post.
 */
function getImage(post: lexicon.app.bsky.feed.post.Main): lexicon.app.bsky.embed.images.Image {
  const { embed } = post
  const image =
    embed && lexicon.app.bsky.embed.images.main.isTypeOf(embed) ? embed.images[0] : undefined
  if (!image) throw new Error('Expected an image')
  return image
}

/**
 * Get the newest post in the repo.
 */
async function getPost(repo: Client): Promise<lexicon.app.bsky.feed.post.Main> {
  const {
    records: [record],
  } = await repo.list(lexicon.app.bsky.feed.post.main)
  if (!record?.valid) throw new Error('Expected a valid post')
  return record.value
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
