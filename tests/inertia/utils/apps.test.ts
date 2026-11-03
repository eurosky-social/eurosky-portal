import assert from 'node:assert/strict'
import test from 'node:test'
import type { AtUriString } from '@atproto/syntax'
import { find, preferred, toUri } from '../../../inertia/utils/apps.ts'

const bluesky = 'at://did:plc:dvy6bdnofdfc4php4s5b457d/fyi.atstore.listing.detail/3mj667g65ct2x'
// The default app.
const mu = 'at://did:plc:izttpdp3l6vss5crelt5kcux/fyi.atstore.listing.detail/3mqmb7emiusy5'
const choices: Array<[AtUriString, string]> = [
  ['at://a.com', '1'],
  ['at://b.com', '2'],
  [mu, '3'],
]

test('find', function () {
  test('should find apps that open posts', function () {
    const result = find('at://did:web:a.com/app.bsky.feed.post/b').find(function ([app]) {
      return app === bluesky
    })

    assert.deepEqual(result, [bluesky, 'https://bsky.app/profile/did:web:a.com/post/b'])
  })

  test('should find several apps', function () {
    const result = find('at://did:web:a.com/app.bsky.feed.post/b').length > 1

    assert.equal(result, true)
  })

  test('should find apps that open tags', function () {
    const result = find('at-tag://b%20c').find(function ([app]) {
      return app === bluesky
    })

    assert.deepEqual(result, [bluesky, 'https://bsky.app/hashtag/b%20c'])
  })

  test('should not find apps for empty tags', function () {
    const result = find('at-tag://')

    assert.deepEqual(result, [])
  })

  test('should not find apps for invalid tags', function () {
    const result = find('at-tag://%E0%A4%A')

    assert.deepEqual(result, [])
  })

  test('should not find apps for invalid URIs', function () {
    // @ts-expect-error: test runtime behavior.
    const result = find('at://!')

    assert.deepEqual(result, [])
  })
})

test('preferred', function () {
  test('should prefer stored choices', function () {
    const result = preferred(choices, '["at://x.com","at://b.com"]', ['at://a.com'])?.[1]

    assert.equal(result, '2')
  })

  test('should then prefer favorites', function () {
    const result = preferred(choices, null, ['at://a.com'])?.[1]

    assert.equal(result, '1')
  })

  test('should then prefer the default app', function () {
    const result = preferred(choices, 'invalid')?.[1]

    assert.equal(result, '3')
  })

  test('should then prefer the first', function () {
    const result = preferred(choices.slice(0, 2), '{}')?.[1]

    assert.equal(result, '1')
  })

  test('should not prefer anything without choices', function () {
    const result = preferred([], null)

    assert.equal(result, undefined)
  })
})

test('toUri', function () {
  test('should support profiles', function () {
    const result = toUri('https://bsky.app/profile/a.com')

    assert.equal(result, 'at://a.com')
  })

  test('should support posts', function () {
    const result = toUri('https://bsky.app/profile/a.com/post/b')

    assert.equal(result, 'at://a.com/app.bsky.feed.post/b')
  })

  test('should support tags', function () {
    const result = toUri('https://bsky.app/hashtag/b%20c')

    assert.equal(result, 'at-tag://b%20c')
  })

  test('should not support things that are not URLs', function () {
    const result = toUri('a')

    assert.equal(result, undefined)
  })

  test('should not support other protocols', function () {
    const result = toUri('mailto:a@b.com')

    assert.equal(result, undefined)
  })

  test('should not support unknown apps', function () {
    const result = toUri('https://a.com')

    assert.equal(result, undefined)
  })
})
