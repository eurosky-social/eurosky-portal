import assert from 'node:assert/strict'
import test from 'node:test'
import { type BlobRef, parseCid } from '@atproto/lex'
import * as lexicon from '#lexicons/index'
import { toEmbed } from '#utils/embed'

// Raw (`bafkrei`), then all-zero SHA-256 hash.
const cid = `bafkrei${'a'.repeat(52)}`
const context = { did: 'did:web:a.com', pds: 'https://b.com' } as const
const image: BlobRef = { $type: 'blob', mimeType: 'image/png', ref: parseCid(cid), size: 1 }
const video: BlobRef = { $type: 'blob', mimeType: 'video/mp4', ref: parseCid(cid), size: 1 }
const record = { cid, uri: 'at://did:web:a.com/app.bsky.feed.post/c' } as const

test('toEmbed', function () {
  test('should support images', function () {
    const embed = lexicon.app.bsky.embed.images.$build({
      images: [{ alt: 'a', aspectRatio: { height: 1, width: 2 }, image }],
    })
    const result = toEmbed(embed, context)

    assert.deepEqual(result, {
      images: [{ alt: 'a', aspectRatio: { height: 1, width: 2 }, blob: { cid, ...context } }],
      type: 'images',
    })
  })

  test('should support images without aspect ratio', function () {
    const embed = lexicon.app.bsky.embed.images.$build({ images: [{ alt: '', image }] })
    const result = toEmbed(embed, context)

    assert.deepEqual(result, {
      images: [{ alt: '', aspectRatio: undefined, blob: { cid, ...context } }],
      type: 'images',
    })
  })

  test('should support galleries', function () {
    const embed = lexicon.app.bsky.embed.gallery.$build({
      items: [
        lexicon.app.bsky.embed.gallery.image.$build({
          alt: 'a',
          aspectRatio: { height: 1, width: 2 },
          image,
        }),
      ],
    })
    const result = toEmbed(embed, context)

    assert.deepEqual(result, {
      images: [{ alt: 'a', aspectRatio: { height: 1, width: 2 }, blob: { cid, ...context } }],
      type: 'images',
    })
  })

  test('should support externals', function () {
    const embed = lexicon.app.bsky.embed.external.$build({
      external: { description: 'a', thumb: image, title: 'b', uri: 'https://c.com' },
    })
    const result = toEmbed(embed, context)

    assert.deepEqual(result, {
      description: 'a',
      thumbnail: { cid, ...context },
      title: 'b',
      type: 'external',
      uri: 'https://c.com',
    })
  })

  test('should support externals without thumbnail', function () {
    const embed = lexicon.app.bsky.embed.external.$build({
      external: { description: 'a', title: 'b', uri: 'https://c.com' },
    })
    const result = toEmbed(embed, context)

    assert.deepEqual(result, {
      description: 'a',
      thumbnail: undefined,
      title: 'b',
      type: 'external',
      uri: 'https://c.com',
    })
  })

  test('should support videos', function () {
    const embed = lexicon.app.bsky.embed.video.$build({ video })
    const result = toEmbed(embed, context)

    assert.deepEqual(result, { type: 'video' })
  })

  test('should support records', function () {
    const embed = lexicon.app.bsky.embed.record.$build({ record })
    const result = toEmbed(embed, context)

    assert.deepEqual(result, { media: undefined, type: 'record', uri: record.uri })
  })

  test('should support records with media', function () {
    const embed = lexicon.app.bsky.embed.recordWithMedia.$build({
      media: lexicon.app.bsky.embed.images.$build({ images: [{ alt: 'a', image }] }),
      record: lexicon.app.bsky.embed.record.$build({ record }),
    })
    const result = toEmbed(embed, context)

    assert.deepEqual(result, {
      media: {
        images: [{ alt: 'a', aspectRatio: undefined, blob: { cid, ...context } }],
        type: 'images',
      },
      type: 'record',
      uri: record.uri,
    })
  })

  test('should support unknown embeds', function () {
    // @ts-expect-error: test runtime behavior.
    const result = toEmbed({ $type: 'a.b.c' }, context)

    assert.deepEqual(result, { type: 'unknown' })
  })
})
