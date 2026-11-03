import assert from 'node:assert/strict'
import test from 'node:test'
import type { Profile } from '#extensions/atprotouser'
import ProfileTransformer from '#transformers/profile_transformer'

test('ProfileTransformer', function () {
  test('should put counts in `stats`', function () {
    const profile: Profile = {
      avatar: 'https://a.com',
      did: 'did:web:b.com',
      displayName: 'c',
      followersCount: 1,
      followsCount: 2,
      handle: 'd.com',
      postsCount: 3,
    }
    const result = new ProfileTransformer(profile).toObject()

    assert.deepEqual(result, {
      avatar: 'https://a.com',
      displayName: 'c',
      stats: { followers: 1, follows: 2, posts: 3 },
    })
  })
})
