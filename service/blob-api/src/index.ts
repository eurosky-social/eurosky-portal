import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type Database from 'better-sqlite3'
import {
  portalSyncPath,
  type ListBlobDetailsBlob,
  type ListBlobDetailsOutputBody,
  type ListBlobDetailsParams,
  type StorageBreakdownCategory,
  type StorageBreakdownOutputBody,
} from '../../../shared/portal_sync.js'

/**
 * Blob row.
 */
export interface BlobRow extends Cursor {
  /**
   * MIME type (example: `image/png`).
   */
  mimeType?: string | undefined

  /**
   * Size in bytes (example: `1024`).
   */
  size: number
}

/**
 * Breakdown row.
 */
interface BreakdownRow {
  /**
   * Size in bytes (example: `1024`).
   */
  bytes: number

  /**
   * Category (example: `image`).
   */
  category: StorageBreakdownCategory['category']

  /**
   * Number of files (example: `42`).
   */
  files: number
}

/**
 * Cursor shape for stable pagination.
 */
interface Cursor {
  /**
   * CID (example: `bafkrei…`).
   */
  cid: string

  /**
   * Creation timestamp (example: `2026-01-01T00:00:00Z`).
   */
  createdAt: string
}

/**
 * DID string (example: `did:plc:abc123`).
 */
type Did = ListBlobDetailsParams['did']

/**
 * Supported filter category values for list queries.
 *
 * Corresponds to {@linkcode StorageBreakdownCategory.category}, but w/o the
 * `l.UnknownString`.
 */
type FilterCategory = 'image' | 'other' | 'video'

/**
 * Configuration.
 */
interface Options {
  /**
   * Database.
   */
  database: Pick<Database.Database, 'prepare'>

  /**
   * Token.
   */
  token: string
}

const didExpression = /^did:[^:]+:.+$/

/**
 * Check if `value` is a date time string.
 *
 * @param value
 *   Value.
 * @returns
 *   Nothing
 * @throws
 *   When `value` is not a datetime string.
 */
function assertDatetimeString(value: unknown): asserts value is ListBlobDetailsBlob['createdAt'] {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error('Invalid datetime string')
  }
}

/**
 * Check if `value` is a DID.
 *
 * @param value
 *   Value.
 * @returns
 *   Nothing
 * @throws
 *   When `value` is not a DID.
 */
function assertDid(value: unknown): asserts value is Did {
  if (typeof value !== 'string' || !didExpression.test(value)) {
    throw new Error('Invalid DID')
  }
}

/**
 * Check if `value` is a supported filter category.
 *
 * @param value
 *   Value.
 * @returns
 *   Nothing
 * @throws
 *   When `value` is not a supported category.
 */
function assertFilterCategory(value: unknown): asserts value is FilterCategory {
  if (value !== 'image' && value !== 'other' && value !== 'video') {
    throw new Error('Invalid filter category')
  }
}

/**
 * Create API.
 *
 * @param options
 *   Configuration.
 * @returns
 *   Hono app.
 */
export function createApi(options: Options): Hono {
  const { database, token: apiToken } = options

  const app = new Hono()

  /**
   * Probably good to have a health check.
   */
  app.get('/health', function (context) {
    return context.text('OK')
  })

  /**
   * Require a valid token on XRPC routes.
   */
  app.use('/xrpc/*', async function (context, next) {
    const [scheme, token] = (context.req.header('authorization') ?? '').split(' ')

    if (scheme !== 'Bearer' || token !== apiToken) {
      return context.json({ error: 'Unauthorized' }, 401)
    }

    return next()
  })

  /**
   * List blob metadata details for a given DID.
   * Like <https://docs.bsky.app/docs/api/com-atproto-sync-list-blobs> but with
   * `mimeType` and `size` fields.
   *
   * Optional query parameters:
   * - `category`: restricts results to a single category (`image`/`video`/`other`)
   *
   * Cursor behavior:
   * - the cursor is scoped to the current query shape (DID + category filter +
   *   ordering)
   * - changing the `category` filter between requests invalidates the cursor
   */
  app.get(portalSyncPath.listBlobDetails, async function (context) {
    const url = new URL(context.req.url)
    const cursorParameter = url.searchParams.get('cursor')
    let cursor: Cursor | undefined

    if (cursorParameter) {
      try {
        cursor = decodeCursor(cursorParameter)
      } catch {
        throw new HTTPException(400, { message: 'Invalid cursor' })
      }
    }

    const didParameter = url.searchParams.get('did')

    if (!didParameter) {
      throw new HTTPException(400, { message: 'Missing required parameter: did' })
    }

    let did: Did

    try {
      assertDid(didParameter)
      did = didParameter
    } catch {
      throw new HTTPException(400, { message: 'Invalid DID format' })
    }

    // Default page size; see: <https://docs.bsky.app/docs/api/com-atproto-sync-list-blobs>.
    const limitText = url.searchParams.get('limit') ?? '500'

    if (!/^\d+$/.test(limitText)) {
      throw new HTTPException(400, { message: 'Limit must be an integer' })
    }

    const limit = Number(limitText)

    if (limit < 1) {
      throw new HTTPException(400, { message: 'Limit must be at least 1' })
    }
    if (limit > 1000) {
      throw new HTTPException(400, { message: 'Limit must not exceed 1000' })
    }

    let category: FilterCategory | undefined
    const categoryParameter = url.searchParams.get('category')

    if (categoryParameter) {
      try {
        assertFilterCategory(categoryParameter)
        category = categoryParameter
      } catch {
        throw new HTTPException(400, {
          message: 'Category must be one of: image, other, video',
        })
      }
    }

    const sql = [
      'SELECT cid, createdAt, mimeType, COALESCE(size, 0) AS size FROM blob WHERE creator = ?',
    ]
    const parameters: Array<unknown> = [did]

    if (category) {
      sql.push(
        "AND (CASE WHEN mimeType LIKE 'image/%' THEN 'image' WHEN mimeType LIKE 'video/%' THEN 'video' ELSE 'other' END) = ?"
      )
      parameters.push(category)
    }

    if (cursor) {
      sql.push('AND (createdAt < ? OR (createdAt = ? AND cid < ?))')
      parameters.push(cursor.createdAt, cursor.createdAt, cursor.cid)
    }

    sql.push('ORDER BY createdAt DESC, cid DESC LIMIT ?')
    parameters.push(limit)

    const rows = database.prepare(sql.join(' ')).all(...parameters) as Array<BlobRow>
    const last = rows.at(-1)

    const result: ListBlobDetailsOutputBody = {
      blobs: rows.map(function (row) {
        const { cid, createdAt, mimeType, size } = row
        assertDatetimeString(createdAt)
        return mimeType ? { cid, createdAt, mimeType, size } : { cid, createdAt, size }
      }),
      cursor: rows.length === limit && last ? encodeCursor(last) : undefined,
      did,
    }

    return context.json(result)
  })

  /**
   * Get a breakdown of storage use.
   */
  app.get(portalSyncPath.getStorageBreakdown, async function (context) {
    const url = new URL(context.req.url)
    const didParameter = url.searchParams.get('did')

    if (!didParameter) {
      throw new HTTPException(400, { message: 'Missing required parameter: did' })
    }

    let did: Did

    try {
      assertDid(didParameter)
      did = didParameter
    } catch {
      throw new HTTPException(400, { message: 'Invalid DID format' })
    }

    const rows = database
      .prepare(
        `
      SELECT
        CASE
          WHEN mimeType LIKE 'image/%' THEN 'image'
          WHEN mimeType LIKE 'video/%' THEN 'video'
          ELSE 'other'
        END AS category,
        COUNT(*) AS files,
        COALESCE(SUM(size), 0) AS bytes
      FROM blob
      WHERE creator = ?
      GROUP BY category
      ORDER BY bytes DESC
      `
      )
      .all(did) as Array<BreakdownRow>

    const result: StorageBreakdownOutputBody = {
      categories: rows.map(function (row) {
        const { bytes, files, category } = row
        return { bytes, files, category }
      }),
      did,
    }

    return context.json(result)
  })

  /**
   * 404.
   */
  app.notFound(function (context) {
    return context.json({ error: 'Not Found' }, 404)
  })

  /**
   * Handle errors.
   */
  app.onError(function (error, context) {
    if (error instanceof HTTPException) {
      return context.json({ error: error.message }, error.status)
    }

    console.error(error)
    return context.json({ error: 'Internal Server Error' }, 500)
  })

  return app
}

/**
 * Decode a cursor.
 *
 * @param value
 *   Cursor string (base64url-encoded JSON fields).
 * @returns
 *   Cursor fields.
 * @throws
 *   When `value` is invalid.
 */
export function decodeCursor(value: string): Cursor {
  const json = Buffer.from(value, 'base64url').toString('utf8')
  const parsed: unknown = JSON.parse(json)

  if (
    parsed &&
    typeof parsed === 'object' &&
    'cid' in parsed &&
    'createdAt' in parsed &&
    typeof parsed.cid === 'string' &&
    typeof parsed.createdAt === 'string'
  ) {
    return { cid: parsed.cid, createdAt: parsed.createdAt }
  }

  throw new Error('Invalid cursor')
}

/**
 * Encode a cursor.
 *
 * @param value
 *   Cursor fields.
 * @returns
 *   Cursor string.
 */
export function encodeCursor(value: Cursor): string {
  const json = JSON.stringify({ cid: value.cid, createdAt: value.createdAt })

  return Buffer.from(json, 'utf8').toString('base64url')
}
