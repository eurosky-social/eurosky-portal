import assert from 'node:assert/strict'
import test from 'node:test'
import { jsonToLex } from '@atproto/lex'
import * as lexicon from '#lexicons'
import ActivityTransformer from '#transformers/activity_transformer'

// Raw (`bafkrei`), then all-zero SHA-256 hash.
const cid = `bafkrei${'a'.repeat(52)}`
const createdAt = '2026-01-01T00:00:00.000Z'
const iso = '2026-01-01T00:00:00.000+00:00'
const context = {
  did: 'did:web:a.com',
  pds: 'https://b.com',
  uri: 'at://did:web:a.com/c.d.e/f',
} as const
const subject = { cid, uri: 'at://did:web:g.com/app.bsky.feed.post/h' } as const
const document = {
  $type: 'site.standard.document',
  publishedAt: createdAt,
  site: 'https://g.com',
  title: 'h',
} as const

test('ActivityTransformer', function () {
  test('should open the subject of likes', function () {
    const like = { $type: 'app.bsky.feed.like', createdAt, subject } as const
    const result = new ActivityTransformer(like, context).toObject()

    assert.deepEqual(result, {
      $type: 'app.bsky.feed.like',
      createdAt: iso,
      openUri: subject.uri,
    })
  })

  test('should open posts themselves, with what they reply to', function () {
    const post = {
      $type: 'app.bsky.feed.post',
      createdAt,
      reply: { parent: subject, root: subject },
      text: 'a',
    } as const
    const result = new ActivityTransformer(post, context).toObject()

    assert.deepEqual(result, {
      $type: 'app.bsky.feed.post',
      createdAt: iso,
      embed: undefined,
      openUri: context.uri,
      replyUri: subject.uri,
      text: [{ type: 'text', value: 'a' }],
    })
  })

  test('should open the subject of follows', function () {
    const follow = { $type: 'app.bsky.graph.follow', createdAt, subject: 'did:web:g.com' } as const
    const result = new ActivityTransformer(follow, context).toObject()

    assert.deepEqual(result, {
      $type: 'app.bsky.graph.follow',
      createdAt: iso,
      openUri: 'at://did:web:g.com',
      subject: 'did:web:g.com',
    })
  })

  test('should support documents with Leaflet content and a cover image', function () {
    const value = lexicon.site.standard.document.$parse(
      jsonToLex({
        ...document,
        content: {
          $type: 'pub.leaflet.content',
          pages: [
            {
              $type: 'pub.leaflet.pages.linearDocument',
              blocks: [{ block: { $type: 'pub.leaflet.blocks.text', plaintext: 'a' } }],
            },
          ],
        },
        coverImage: { $type: 'blob', mimeType: 'image/png', ref: { $link: cid }, size: 1 },
      })
    )
    const result = new ActivityTransformer(value, context).toObject()

    assert.deepEqual(result, {
      $type: 'site.standard.document',
      content: {
        children: [
          {
            children: [{ type: 'text', value: 'a' }],
            properties: {},
            tagName: 'p',
            type: 'element',
          },
        ],
        type: 'root',
      },
      contributors: undefined,
      coverImage: { cid, did: context.did, pds: context.pds },
      createdAt: iso,
      description: undefined,
      openUri: context.uri,
      publishedAt: createdAt,
      tags: undefined,
      textContent: undefined,
      title: 'h',
      updatedAt: undefined,
    })
  })

  test('should truncate long content', function () {
    const value = lexicon.site.standard.document.$parse({
      ...document,
      content: {
        $type: 'pub.leaflet.content',
        pages: [
          {
            $type: 'pub.leaflet.pages.linearDocument',
            blocks: [{ block: { $type: 'pub.leaflet.blocks.text', plaintext: 'a'.repeat(5000) } }],
          },
        ],
      },
    })
    const result = new ActivityTransformer(value, context).toObject()
    const content = 'content' in result ? result.content : undefined

    assert.deepEqual(content, {
      children: [
        {
          // `4096`, minus `30` that `hast-util-truncate` strips looking for a break, plus `…`.
          children: [{ type: 'text', value: 'a'.repeat(4066) + '…' }],
          properties: {},
          tagName: 'p',
          type: 'element',
        },
      ],
      type: 'root',
    })
  })

  test('should drop other content', function () {
    const value = lexicon.site.standard.document.$parse({
      ...document,
      content: { $type: 'g.h.i' },
    })
    const result = new ActivityTransformer(value, context).toObject()
    const content = 'content' in result ? result.content : undefined

    assert.equal(content, undefined)
  })
})
