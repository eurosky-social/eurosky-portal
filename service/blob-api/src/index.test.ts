import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import test from 'node:test'
import { createApi, encodeCursor, type BlobRow } from '@eurosky/blob-api'
import Database from 'better-sqlite3'
import { lookup as lookupMimeType } from 'mime-types'
import { CID } from 'multiformats/cid'
import { code } from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { portalSyncPath } from '../../../shared/portal_sync.js'

const { getStorageBreakdown, listBlobDetails } = portalSyncPath
const token = randomBytes(32).toString('hex')
const authorization = `Bearer ${token}`
const did = 'did:plc:alice'
const faviconPng = await createBlob('../../../public/icons/favicon-32x32.png')
const logoBlackPng = await createBlob('../../../inertia/images/logo-black.png')
const packageJson = await createBlob('../package.json')
const rows: Array<[BlobRow, string]> = [
  [logoBlackPng, did],
  [packageJson, did],
  [faviconPng, 'did:plc:bob'],
]

test('blob-api', async function (t) {
  await t.test('/health', async function (st) {
    const route = '/health'

    await st.test('should work', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const response = await app.request(route)
        assert.equal(response.status, 200)
        assert.equal(await response.text(), 'OK')
      } finally {
        database.close()
      }
    })
  })

  await t.test(getStorageBreakdown, async function (st) {
    const route = getStorageBreakdown

    await st.test('should fail w/o `authorization`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ did })
        const response = await app.request(url)
        assert.equal(response.status, 401)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Unauthorized' })
      } finally {
        database.close()
      }
    })

    await st.test('should fail w/ invalid `authorization`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ did })
        const response = await app.request(url, {
          headers: { authorization: 'Bearer invalid-token' },
        })
        assert.equal(response.status, 401)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Unauthorized' })
      } finally {
        database.close()
      }
    })

    await st.test('should fail w/ invalid `authorization` (scheme)', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ did })
        const response = await app.request(url, {
          headers: { authorization: `Token ${token}` },
        })
        assert.equal(response.status, 401)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Unauthorized' })
      } finally {
        database.close()
      }
    })

    await st.test('should fail w/o `did`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const response = await app.request(route, { headers: { authorization } })
        assert.equal(response.status, 400)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Missing required parameter: did' })
      } finally {
        database.close()
      }
    })

    await st.test('should fail w/ invalid `did`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ did: 'not-a-did' })
        const response = await app.request(url, { headers: { authorization } })
        assert.equal(response.status, 400)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Invalid DID format' })
      } finally {
        database.close()
      }
    })

    await st.test('should work w/ `did`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ did })
        const response = await app.request(url, { headers: { authorization } })
        assert.equal(response.status, 200)
        const body: unknown = await response.json()
        assert.deepEqual(body, {
          categories: [
            { category: 'image', files: 1, bytes: logoBlackPng.size },
            { category: 'other', files: 1, bytes: packageJson.size },
          ],
          did,
        })
      } finally {
        database.close()
      }
    })
  })

  await t.test(listBlobDetails, async function (st) {
    const route = listBlobDetails

    await st.test('should fail w/o `authorization`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ did })
        const response = await app.request(url)
        assert.equal(response.status, 401)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Unauthorized' })
      } finally {
        database.close()
      }
    })

    await st.test('should fail w/ invalid `authorization`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ did })
        const response = await app.request(url, {
          headers: { authorization: 'Bearer invalid-token' },
        })
        assert.equal(response.status, 401)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Unauthorized' })
      } finally {
        database.close()
      }
    })

    await st.test('should fail w/ invalid `authorization` (scheme)', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ did })
        const response = await app.request(url, {
          headers: { authorization: `Token ${token}` },
        })
        assert.equal(response.status, 401)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Unauthorized' })
      } finally {
        database.close()
      }
    })

    await st.test('should fail w/o `did`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const response = await app.request(route, { headers: { authorization } })
        assert.equal(response.status, 400)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Missing required parameter: did' })
      } finally {
        database.close()
      }
    })
    await st.test('should fail w/ invalid `did`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ did: 'not-a-did' })
        const response = await app.request(url, { headers: { authorization } })
        assert.equal(response.status, 400)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Invalid DID format' })
      } finally {
        database.close()
      }
    })

    await st.test('should work w/ `did`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ did })
        const response = await app.request(url, { headers: { authorization } })
        assert.equal(response.status, 200)
        const body: unknown = await response.json()
        assert.deepEqual(body, { blobs: [packageJson, logoBlackPng], did })
      } finally {
        database.close()
      }
    })

    await st.test('should fail w/ invalid `limit`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ did, limit: 'abc' })
        const response = await app.request(url, { headers: { authorization } })
        assert.equal(response.status, 400)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Limit must be an integer' })
      } finally {
        database.close()
      }
    })

    await st.test('should fail w/ invalid `limit` (too small)', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ did, limit: '0' })
        const response = await app.request(url, { headers: { authorization } })
        assert.equal(response.status, 400)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Limit must be at least 1' })
      } finally {
        database.close()
      }
    })

    await st.test('should fail w/ invalid `limit` (too big)', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ did, limit: '1001' })
        const response = await app.request(url, { headers: { authorization } })
        assert.equal(response.status, 400)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Limit must not exceed 1000' })
      } finally {
        database.close()
      }
    })

    await st.test('should work w/ `limit`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ did, limit: '2' })
        const response = await app.request(url, { headers: { authorization } })
        assert.equal(response.status, 200)
        const body: unknown = await response.json()
        const blobs = [packageJson, logoBlackPng]
        assert.deepEqual(body, { blobs, cursor: encodeCursor(logoBlackPng), did })
      } finally {
        database.close()
      }
    })

    await st.test('should fail w/ invalid `category`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ category: 'invalid', did })
        const response = await app.request(url, { headers: { authorization } })
        assert.equal(response.status, 400)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Category must be one of: image, other, video' })
      } finally {
        database.close()
      }
    })

    await st.test('should work w/ `category`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ category: 'image', did })
        const response = await app.request(url, { headers: { authorization } })
        assert.equal(response.status, 200)
        const body: unknown = await response.json()
        assert.deepEqual(body, { blobs: [logoBlackPng], did })
      } finally {
        database.close()
      }
    })

    await st.test('should fail w/ invalid `cursor`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const url = route + '?' + new URLSearchParams({ cursor: 'invalid', did })
        const response = await app.request(url, { headers: { authorization } })
        assert.equal(response.status, 400)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Invalid cursor' })
      } finally {
        database.close()
      }
    })

    await st.test('should work w/ `cursor`', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const cursor = encodeCursor(packageJson)
        const url = route + '?' + new URLSearchParams({ cursor, did, limit: '1' })
        const response = await app.request(url, { headers: { authorization } })
        assert.equal(response.status, 200)
        const body: unknown = await response.json()
        assert.deepEqual(body, {
          blobs: [logoBlackPng],
          cursor: encodeCursor(logoBlackPng),
          did,
        })
      } finally {
        database.close()
      }
    })
  })

  await t.test('*', async function (st) {
    await st.test('should fail w/ an unknown route', async function () {
      const database = createDatabase()

      try {
        const app = createApi({ database, token })
        const response = await app.request('/unknown')
        assert.equal(response.status, 404)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Not Found' })
      } finally {
        database.close()
      }
    })

    await st.test('should fail w/ internal errors', async function () {
      const error = new Error('Boom!')
      const database = {
        prepare(): never {
          throw error
        },
      }

      const consoleError = console.error
      let loggedError: unknown
      console.error = captureConsoleError

      try {
        const app = createApi({ database, token })
        const url = getStorageBreakdown + '?' + new URLSearchParams({ did })
        const response = await app.request(url, { headers: { authorization } })
        assert.equal(response.status, 500)
        const body: unknown = await response.json()
        assert.deepEqual(body, { error: 'Internal Server Error' })
        assert(loggedError instanceof Error)
        assert.equal(loggedError.message, error.message)
      } finally {
        console.error = consoleError
      }

      function captureConsoleError(message: unknown): undefined {
        loggedError = message
      }
    })
  })
})

/**
 * Create a blob row from a file relative to the current module.
 *
 * @param relative
 *   Relative file URL (example: `../package.json`).
 * @returns
 *   Promise that resolves to a blob row.
 */
async function createBlob(relative: string): Promise<BlobRow> {
  const url = new URL(relative, import.meta.url)
  const mimeType = lookupMimeType(url.pathname)
  const { mtime, size } = await stat(url)
  const digest = await sha256.digest(await readFile(url))

  return {
    cid: CID.createV1(code, digest).toString(),
    createdAt: mtime.toISOString(),
    mimeType: typeof mimeType === 'string' ? mimeType : undefined,
    size: size,
  }
}

/**
 * Create an in-memory database with test data.
 *
 * @returns
 *   In-memory database instance.
 */
function createDatabase(): Database.Database {
  const database = new Database(':memory:')

  database.exec(`
    CREATE TABLE blob (
      cid TEXT NOT NULL PRIMARY KEY,
      createdAt TEXT NOT NULL,
      creator TEXT NOT NULL,
      mimeType TEXT,
      size INTEGER
    );

    CREATE INDEX blob_creator_createdAt_cid_idx
      ON blob (creator, createdAt DESC, cid DESC);
  `)

  const insert = database.prepare(
    'INSERT INTO blob (cid, createdAt, creator, mimeType, size) VALUES (?, ?, ?, ?, ?)'
  )

  for (const [row, creator] of rows) {
    insert.run(row.cid, row.createdAt, creator, row.mimeType, row.size)
  }

  return database
}
