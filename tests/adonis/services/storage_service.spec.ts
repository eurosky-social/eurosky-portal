import cache from '@adonisjs/cache/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Account from '#models/account'
import Blob from '#models/blob'
import storageService from '#services/storage_service'

const did = 'did:web:a.com'
const now = DateTime.now()
// Cached and in memory so that there is no network and no database.
const resolved = {
  key: `pds-resolve:${did}`,
  skipL2Write: true,
  value: { did, handle: 'b.com', pds: 'https://c.com' },
}
const image = { category: 'image', cid: 'd', creator: did, mimeType: 'image/png', size: 1 }
const otherImage = { ...image, cid: 'e', size: 2 }
const video = { category: 'video', cid: 'f', creator: did, mimeType: 'video/mp4', size: 4 }

test.group('services / storage / getStorage', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should be syncing before the first backfill', async function ({ assert }) {
    await Account.create({ did })
    const result = await storageService.getStorage({ did })

    assert.deepEqual(result, { state: 'syncing' })
  })

  test('should fail without a full sync', async function ({ assert }) {
    await Account.create({ did, lastStorageSyncAt: now })
    const result = await storageService.getStorage({ did })

    assert.deepEqual(result, { state: 'failed' })
  })

  test('should include the PDS', async function ({ assert }) {
    await cache.set(resolved)
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await Blob.create(image)
    const result = await storageService.getStorage({ did })
    const pds = 'pds' in result ? result.pds : undefined

    assert.equal(pds, 'https://c.com')
  })

  test('should list biggest first', async function ({ assert }) {
    await cache.set(resolved)
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await Blob.createMany([image, video])
    const result = await storageService.getStorage({ did })
    const blobs = 'blobs' in result ? result.blobs : []

    assert.deepEqual(
      blobs.map(function (d) {
        return d.cid
      }),
      ['f', 'd']
    )
  })

  test('should break down by category, biggest first', async function ({ assert }) {
    await cache.set(resolved)
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await Blob.createMany([image, otherImage, video])
    const result = await storageService.getStorage({ did })
    const breakdown = 'breakdown' in result ? result.breakdown : []

    assert.deepEqual(breakdown, [
      { bytes: 4, category: 'video', files: 1 },
      { bytes: 3, category: 'image', files: 2 },
    ])
  })

  test('should count all files in `total`', async function ({ assert }) {
    await cache.set(resolved)
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await Blob.createMany([image, video])
    const result = await storageService.getStorage({ did })
    const total = 'total' in result ? result.total : undefined

    assert.equal(total, 2)
  })

  test('should support `category`', async function ({ assert }) {
    await cache.set(resolved)
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await Blob.createMany([image, video])
    const result = await storageService.getStorage({ category: 'image', did })
    const blobs = 'blobs' in result ? result.blobs : []

    assert.deepEqual(
      blobs.map(function (d) {
        return d.cid
      }),
      ['d']
    )
  })

  test('should count files in `category` in `total`', async function ({ assert }) {
    await cache.set(resolved)
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await Blob.createMany([image, video])
    const result = await storageService.getStorage({ category: 'image', did })
    const total = 'total' in result ? result.total : undefined

    assert.equal(total, 1)
  })

  test('should list 48 per page', async function ({ assert }) {
    await cache.set(resolved)
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await Blob.createMany(
      Array.from({ length: 49 }, function (_, index) {
        return { ...image, cid: `a${index}`, size: index + 1 }
      })
    )
    const result = await storageService.getStorage({ did })
    const blobs = 'blobs' in result ? result.blobs : []

    assert.equal(blobs.length, 48)
  })

  test('should not have `next` on the last page', async function ({ assert }) {
    await cache.set(resolved)
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await Blob.create(image)
    const result = await storageService.getStorage({ did })
    const next = 'next' in result ? result.next : undefined

    assert.equal(next, null)
  })

  test('should list the next page with `next`', async function ({ assert }) {
    await cache.set(resolved)
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await Blob.createMany(
      Array.from({ length: 49 }, function (_, index) {
        return { ...image, cid: `a${index}`, size: index + 1 }
      })
    )
    const first = await storageService.getStorage({ did })
    const next = 'next' in first ? first.next : null
    const snapshot = 'snapshot' in first ? first.snapshot : null
    const result = await storageService.getStorage({
      after: next ?? undefined,
      did,
      snapshot: snapshot ?? undefined,
    })
    const blobs = 'blobs' in result ? result.blobs : []

    assert.notEqual(next, null)
    // Only the smallest is left.
    assert.deepEqual(
      blobs.map(function (d) {
        return d.cid
      }),
      ['a0']
    )
  })
})
