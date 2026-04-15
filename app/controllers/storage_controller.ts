import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import database from '@adonisjs/lucid/services/db'
import type { Client } from '@atproto/lex-client'
import type { l } from '@atproto/lex'
import * as lexicon from '#lexicons'
import env from '#start/env'
import {
  portalSyncPath,
  type ListBlobDetailsBlob,
  type ListBlobDetailsOutputBody,
  type StorageBreakdownOutputBody,
} from '../../shared/portal_sync.js'

const blobApiUrl = env.get('BLOB_API_URL')
const blobApiToken = env.get('BLOB_API_TOKEN')

/**
 * Total blobs to get; mostly to prevent DDoSing the server
 * if there is a weird user doing weird things.
 * Better APIs and actual pagination needed in the future.
 */
const MAX = 5_000

/**
 * Get needed data and show the storage page.
 */
export default class StorageController {
  /**
   * Gets a list of all blobs (capped) and renders the storage page.
   */
  async show(context: HttpContext) {
    const { client, did } = context.auth.getUserOrFail()

    if (app.inDev) {
      await this.ensureSeeded(context, client, did)
    }

    const blobs: Array<ListBlobDetailsBlob> = []
    let cursor: string | undefined

    do {
      const remaining = MAX - blobs.length
      const limit = Math.min(1000, remaining)
      const parameters = new URLSearchParams({ did, limit: String(limit) })
      if (cursor) parameters.set('cursor', cursor)
      const url = new URL(portalSyncPath.listBlobDetails + '?' + parameters, blobApiUrl)
      const response = await fetch(url, { headers: { authorization: `Bearer ${blobApiToken}` } })

      if (!response.ok) {
        throw new Error(`Cannot list \`blob-api\` blobs: HTTP ${response.status}`)
      }

      const body = (await response.json()) as ListBlobDetailsOutputBody
      blobs.push(...body.blobs)
      cursor = body.cursor
    } while (cursor && blobs.length < MAX)

    const url = new URL(
      portalSyncPath.getStorageBreakdown + '?' + new URLSearchParams({ did }),
      blobApiUrl
    )
    const response = await fetch(url, { headers: { authorization: `Bearer ${blobApiToken}` } })
    const body = (await response.json()) as StorageBreakdownOutputBody

    return context.inertia.render('storage/show', { blobs, breakdown: body.categories, did })
  }

  /**
   * Check that there are blobs in the local database for a user.
   * If there are none, seed the local database with info from the PDS for the
   * given DID.
   *
   * > **Important**: only used in development.
   *
   * @param context
   *   HTTP context.
   * @param client
   *   Lex client.
   * @param did
   *   User DID.
   * @returns
   *   Promise that resolves when done.
   */
  private async ensureSeeded(
    context: HttpContext,
    client: Client,
    did: l.DidString
  ): Promise<undefined> {
    const [query] = await database.rawQuery<[{ count: number }]>(
      'SELECT COUNT(*) as count FROM "blob" WHERE "creator" = ?',
      [did]
    )

    // Assumption here locally is that there should be a blob if seeded.
    if (query.count > 0) return

    context.logger.info({ did }, 'Seeding blobs for user')
    const cids: Array<string> = []
    let cursor: string | undefined

    // This is development only, so probably no need to impose `MAX`.
    try {
      do {
        const response = await client.xrpc(lexicon.com.atproto.sync.listBlobs.main, {
          params: { cursor, did, limit: 1000 },
        })
        cids.push(...response.body.cids)
        cursor = response.body.cursor
      } while (cursor)
    } catch (error) {
      context.logger.warn({ did, error }, 'Could not seed blobs from `com.atproto.sync.listBlobs`')
      return
    }

    const threads = 10
    let index = 0

    while (index < cids.length) {
      const slice = cids.slice(index, index + threads)

      await Promise.all(
        slice.map(async function (cid) {
          try {
            // TODO: figure out how to do a `HEAD`?
            const response = await client.xrpc(lexicon.com.atproto.sync.getBlob, {
              params: { cid, did },
            })

            const type = response.headers.get('content-type')
            // TODO: why is there no `content-length` for the `application/xml` file I have?
            const contentLength = response.headers.get('content-length')
            const size = typeof contentLength === 'string' ? parseInt(contentLength, 10) : 0
            await database.rawQuery(
              'INSERT OR IGNORE INTO "blob" ("cid", "createdAt", "creator", "mimeType", "size") VALUES (?,?,?,?,?)',
              [cid, new Date(0).toISOString(), did, type, size]
            )
          } catch (error) {
            context.logger.warn({ cid, did, error: String(error) }, 'Could not get or insert blob')
          }
        })
      )

      index += slice.length
    }

    context.logger.info({ count: cids.length, did }, 'Seeded blobs for user')
  }
}
