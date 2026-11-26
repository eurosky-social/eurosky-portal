import testUtils from '@adonisjs/core/services/test_utils'
import type { DidString } from '@atproto/lex'
import { test } from '@japa/runner'
import sharp from 'sharp'
import { DateTime } from 'luxon'
import Account from '#models/account'
import Blob from '#models/blob'
import * as lexicon from '#lexicons/index'
import storageService from '#services/storage_service'
import { createAccount, pdsUrl } from '../../pds.ts'
import { signIn } from '../helpers.ts'

const now = DateTime.now()
const image = { category: 'image', cid: 'd', mimeType: 'image/png', size: 1 }
const otherImage = { ...image, cid: 'e', size: 2 }
const video = { category: 'video', cid: 'f', mimeType: 'video/mp4', size: 4 }

/**
 * DID of an account on the PDS of the tests, made for each test.
 */
let did: DidString

test.group('services / storage / getStorage', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  group.each.setup(async function () {
    const account = await createAccount()
    did = account.did
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
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await createBlobs(image)
    const result = await storageService.getStorage({ did })
    const pds = 'pds' in result ? result.pds : undefined

    assert.equal(pds, pdsUrl())
  })

  test('should list biggest first', async function ({ assert }) {
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await createBlobs(image, video)
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
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await createBlobs(image, otherImage, video)
    const result = await storageService.getStorage({ did })
    const breakdown = 'breakdown' in result ? result.breakdown : []

    assert.deepEqual(breakdown, [
      { bytes: 4, category: 'video', files: 1 },
      { bytes: 3, category: 'image', files: 2 },
    ])
  })

  test('should count all files in `total`', async function ({ assert }) {
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await createBlobs(image, video)
    const result = await storageService.getStorage({ did })
    const total = 'total' in result ? result.total : undefined

    assert.equal(total, 2)
  })

  test('should support `category`', async function ({ assert }) {
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await createBlobs(image, video)
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
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await createBlobs(image, video)
    const result = await storageService.getStorage({ category: 'image', did })
    const total = 'total' in result ? result.total : undefined

    assert.equal(total, 1)
  })

  test('should list 48 per page', async function ({ assert }) {
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await createBlobs(
      ...Array.from({ length: 49 }, function (_, index) {
        return { ...image, cid: `a${index}`, size: index + 1 }
      })
    )
    const result = await storageService.getStorage({ did })
    const blobs = 'blobs' in result ? result.blobs : []

    assert.equal(blobs.length, 48)
  })

  test('should not have `next` on the last page', async function ({ assert }) {
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await createBlobs(image)
    const result = await storageService.getStorage({ did })
    const next = 'next' in result ? result.next : undefined

    assert.equal(next, null)
  })

  test('should list the next page with `next`', async function ({ assert }) {
    await Account.create({ did, lastStorageFullSyncAt: now, lastStorageSyncAt: now })
    await createBlobs(
      ...Array.from({ length: 49 }, function (_, index) {
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

test.group('services / storage / backfill', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should store blobs in the repo', async function ({ assert }) {
    const { did, repo } = await signIn()
    const data = await sharp({
      create: { background: '#ff0000', channels: 3, height: 1, width: 1 },
    })
      .png()
      .toBuffer()
    const { body } = await repo.uploadBlob(data, { encoding: 'image/png' })
    // Blobs only stay when used.
    await repo.create(lexicon.app.bsky.feed.post.main, {
      createdAt: '2026-01-01T00:00:00.000Z',
      embed: lexicon.app.bsky.embed.images.main.build({
        images: [{ alt: '', image: body.blob }],
      }),
      text: 'a',
    })
    await storageService.backfill(did)
    const rows = await Blob.query().where('creator', did)
    const account = await Account.findOrFail(did)

    assert.deepEqual(
      rows.map(function (row) {
        return [row.category, row.mimeType, row.size]
      }),
      [['image', 'image/png', data.byteLength]]
    )
    assert.isNotNull(account.lastStorageFullSyncAt)
  })

  test('should stop when aborted', async function ({ assert }) {
    const { did } = await signIn()
    await assert.rejects(function () {
      return storageService.backfill(did, AbortSignal.abort())
    })
    const account = await Account.findOrFail(did)

    assert.isNull(account.lastStorageFullSyncAt)
  })
})

/**
 * Store blobs of the account of the test.
 */
async function createBlobs(...blobs: Array<typeof image>): Promise<undefined> {
  await Blob.createMany(
    blobs.map(function (blob) {
      return { ...blob, creator: did }
    })
  )
}
