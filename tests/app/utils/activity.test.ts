import assert from 'node:assert/strict'
import test from 'node:test'
import * as lexicon from '#lexicons'
import { isSupportedCollection, toPreview, toValue } from '#utils/activity'

const createdAt = '2026-01-01T00:00:00.000Z'
const post = lexicon.app.bsky.feed.post.$parse({
  $type: 'app.bsky.feed.post',
  createdAt,
  text: 'a',
})
const like = lexicon.app.bsky.feed.like.$parse({
  $type: 'app.bsky.feed.like',
  createdAt,
  subject: {
    // Raw (`bafkrei`), with an all-zero SHA-256 hash.
    cid: `bafkrei${'a'.repeat(52)}`,
    uri: 'at://did:web:a.com/app.bsky.feed.post/b',
  },
})
const follow = lexicon.app.bsky.graph.follow.$parse({
  $type: 'app.bsky.graph.follow',
  createdAt,
  subject: 'did:web:a.com',
})
const document = lexicon.site.standard.document.$parse({
  $type: 'site.standard.document',
  publishedAt: createdAt,
  site: 'https://a.com',
  title: 'b',
})

test('isSupportedCollection', function () {
  test('should support posts', function () {
    const result = isSupportedCollection('app.bsky.feed.post')

    assert.equal(result, true)
  })

  test('should not support reposts', function () {
    const result = isSupportedCollection('app.bsky.feed.repost')

    assert.equal(result, false)
  })

  test('should not support other things', function () {
    const result = isSupportedCollection(undefined)

    assert.equal(result, false)
  })
})

test('toPreview', function () {
  test('should not have text for likes', function () {
    const result = toPreview(like).text

    assert.equal(result, undefined)
  })

  test('should have `createdAt` for likes', function () {
    const result = toPreview(like).createdAt?.toMillis()

    assert.equal(result, Date.parse(createdAt))
  })

  test('should use the text of posts', function () {
    const result = toPreview(post).text

    assert.equal(result, 'a')
  })

  test('should not have text for follows', function () {
    const result = toPreview(follow).text

    assert.equal(result, undefined)
  })

  test('should use the title of documents as text', function () {
    const result = toPreview(document).text

    assert.equal(result, 'b')
  })

  test('should use `publishedAt` of documents as `createdAt`', function () {
    const result = toPreview(document).createdAt?.toMillis()

    assert.equal(result, Date.parse(createdAt))
  })
})

test('toValue', function () {
  test('should return valid records', function () {
    const result = toValue('app.bsky.feed.post', post)

    assert.deepEqual(result, post)
  })

  test('should not return invalid records', function () {
    const result = toValue('app.bsky.feed.post', { ...post, text: 1 })

    assert.equal(result, undefined)
  })

  test('should not return records of unsupported collections', function () {
    const result = toValue('app.bsky.feed.repost', { $type: 'app.bsky.feed.repost' })

    assert.equal(result, undefined)
  })
})
