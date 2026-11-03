import assert from 'node:assert/strict'
import test from 'node:test'
import { toBlobCdnUrl, toBlobPdsUrl } from '../../../inertia/utils/blob.ts'

const blob = { cid: 'a', did: 'did:web:b.com', pds: 'https://c.com' } as const

test('toBlobCdnUrl', function () {
  test('should use the Bluesky CDN', function () {
    const result = toBlobCdnUrl(blob)

    assert.equal(result, 'https://cdn.bsky.app/img/feed_thumbnail/plain/did:web:b.com/a@jpeg')
  })
})

test('toBlobPdsUrl', function () {
  test('should use `getBlob` on the PDS', function () {
    const result = toBlobPdsUrl(blob)

    assert.equal(result, 'https://c.com/xrpc/com.atproto.sync.getBlob?cid=a&did=did%3Aweb%3Ab.com')
  })
})
