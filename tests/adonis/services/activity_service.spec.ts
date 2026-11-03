import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Account from '#models/account'
import ActivityRecord from '#models/activity_record'
import activityService from '#services/activity_service'

const did = 'did:web:a.com'
const ip = '127.0.0.1'
const indexedAt = DateTime.now()
const post = {
  cid: 'b',
  collection: 'app.bsky.feed.post',
  createdAt: DateTime.fromISO('2026-01-01'),
  did,
  indexedAt,
  rkey: 'c',
  text: 'c',
  uri: `at://${did}/app.bsky.feed.post/c`,
} as const
const otherPost = {
  ...post,
  createdAt: DateTime.fromISO('2026-01-02'),
  rkey: 'd',
  text: 'd',
  uri: `at://${did}/app.bsky.feed.post/d`,
} as const
const undatedPost = {
  ...post,
  createdAt: null,
  rkey: 'e',
  text: 'e',
  uri: `at://${did}/app.bsky.feed.post/e`,
} as const
// Not a supported collection.
const repost = {
  ...post,
  collection: 'app.bsky.feed.repost',
  createdAt: DateTime.fromISO('2026-01-03'),
  rkey: 'f',
  text: 'f',
  uri: `at://${did}/app.bsky.feed.repost/f`,
} as const

test.group('services / activity / getRecords', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should be syncing before the first backfill', async function ({ assert }) {
    await Account.create({ did })

    const result = await activityService.getRecords({ did, ip })

    assert.deepEqual(result, { state: 'syncing' })
  })

  test('should list newest first', async function ({ assert }) {
    await Account.create({ did, lastActivitySyncAt: indexedAt })
    await ActivityRecord.createMany([post, otherPost])
    const result = await activityService.getRecords({ did, ip })
    const activities = 'activities' in result ? result.activities : []

    assert.deepEqual(
      activities.map(function (d) {
        return d.text
      }),
      ['d', 'c']
    )
  })

  test('should list undated last', async function ({ assert }) {
    await Account.create({ did, lastActivitySyncAt: indexedAt })
    await ActivityRecord.createMany([undatedPost, post])
    const result = await activityService.getRecords({ did, ip })
    const activities = 'activities' in result ? result.activities : []

    assert.deepEqual(
      activities.map(function (d) {
        return d.text
      }),
      ['c', 'e']
    )
  })

  test('should support `limit`', async function ({ assert }) {
    await Account.create({ did, lastActivitySyncAt: indexedAt })
    await ActivityRecord.createMany([post, otherPost])
    const result = await activityService.getRecords({ did, ip, limit: 1 })
    const activities = 'activities' in result ? result.activities : []

    assert.deepEqual(
      activities.map(function (d) {
        return d.text
      }),
      ['d']
    )
  })

  test('should not list unsupported collections', async function ({ assert }) {
    await Account.create({ did, lastActivitySyncAt: indexedAt })
    await ActivityRecord.createMany([post, repost])
    const result = await activityService.getRecords({ did, ip })
    const activities = 'activities' in result ? result.activities : []

    assert.deepEqual(
      activities.map(function (d) {
        return d.text
      }),
      ['c']
    )
  })

  test('should not let unsupported collections take up slots', async function ({ assert }) {
    await Account.create({ did, lastActivitySyncAt: indexedAt })
    await ActivityRecord.createMany([post, repost])
    const result = await activityService.getRecords({ did, ip, limit: 1 })
    const activities = 'activities' in result ? result.activities : []

    // To do: should be `['c']`: unsupported collections should not be queried.
    // Only happens for rows of collections that were removed from
    // `supportedCollections` as `prune` does not delete them.
    assert.deepEqual(
      activities.map(function (d) {
        return d.text
      }),
      []
    )
  })

  test('should not count unsupported collections in `total`', async function ({ assert }) {
    await Account.create({ did, lastActivitySyncAt: indexedAt })
    await ActivityRecord.createMany([post, repost])
    const result = await activityService.getRecords({ did, ip })
    const total = 'total' in result ? result.total : undefined

    assert.equal(total, 1)
  })

  test('should keep `snapshot`', async function ({ assert }) {
    await Account.create({ did, lastActivitySyncAt: indexedAt })
    await ActivityRecord.create(post)
    const first = await activityService.getRecords({ did, ip })
    const firstSnapshot = 'snapshot' in first ? first.snapshot : undefined
    await ActivityRecord.create(otherPost)
    const result = await activityService.getRecords({ did, ip, snapshot: firstSnapshot })
    const snapshot = 'snapshot' in result ? result.snapshot : undefined

    // Snapshot is **not** a cursor, it should not change.
    assert.equal(snapshot, firstSnapshot)
  })

  test('should leave out later records with `snapshot`', async function ({ assert }) {
    await Account.create({ did, lastActivitySyncAt: indexedAt })
    await ActivityRecord.create(post)
    const first = await activityService.getRecords({ did, ip })
    const firstSnapshot = 'snapshot' in first ? first.snapshot : undefined
    await ActivityRecord.create(otherPost)
    const result = await activityService.getRecords({
      did,
      ip,
      snapshot: firstSnapshot,
    })
    const activities = 'activities' in result ? result.activities : []

    assert.notEqual(firstSnapshot, undefined)
    assert.deepEqual(
      activities.map(function (d) {
        return d.text
      }),
      ['c']
    )
  })
})

test.group('services / activity / prune', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should keep 1000 records', async function ({ assert }) {
    await Account.create({ did })
    await ActivityRecord.createMany(
      Array.from({ length: 1002 }, function (_, index) {
        return {
          ...post,
          createdAt: DateTime.fromMillis(index * 1000),
          rkey: String(index).padStart(4, '0'),
          uri: `at://${did}/app.bsky.feed.post/${String(index).padStart(4, '0')}`,
        }
      })
    )
    await activityService.prune(did)
    const rows = await ActivityRecord.query().where('did', did)

    assert.equal(rows.length, 1000)
  })

  test('should remove the oldest records', async function ({ assert }) {
    await Account.create({ did })
    await ActivityRecord.createMany(
      Array.from({ length: 1002 }, function (_, index) {
        return {
          ...post,
          createdAt: DateTime.fromMillis(index * 1000),
          rkey: String(index).padStart(4, '0'),
          uri: `at://${did}/app.bsky.feed.post/${String(index).padStart(4, '0')}`,
        }
      })
    )
    await activityService.prune(did)
    const oldest = await ActivityRecord.query().where('did', did).orderBy('rkey').first()

    assert.equal(oldest?.rkey, '0002')
  })
})
