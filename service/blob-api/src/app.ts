import { serve } from '@hono/node-server'
import Database from 'better-sqlite3'
import { createApi } from './index.js'

/**
 * Shared token.
 */
const token = process.env.BLOB_API_TOKEN ?? ''

if (token.length < 16) {
  throw new Error('`BLOB_API_TOKEN` must be at least 16 characters long')
}

/**
 * Path to PDS database.
 */
const databasePath = process.env.PDS_DB_PATH

if (!databasePath) {
  throw new Error('`PDS_DB_PATH` is required')
}

/**
 * Port to listen on.
 */
const port = Number(process.env.PORT ?? 4001)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('`PORT` must be an integer between `1` and `65535`')
}

const database = new Database(databasePath, { fileMustExist: true, readonly: true })

database.pragma('query_only = ON')

const app = createApi({ database, token })

serve({ fetch: app.fetch, port }, function () {
  console.log(`blob-api running on :${port}`)
})
