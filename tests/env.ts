/**
 * Environment variables for tests.
 *
 * Imported before anything else by both test runners
 * (`--import` for `node --test`, first in `bin/test.ts`),
 * so that tests do not depend on `.env` files:
 *
 * * values here win over `.env` files as Adonis keeps what is already in
 *   `process.env`
 * * `ENV_PATH` points to a folder without `.env` files so a local `.env`
 *   does not add values either
 * * values here also win over the shell (such as `TZ`) except for `LOG_LEVEL`
 *   which tests do not check, to optionally see logs (`LOG_LEVEL=debug`)
 *
 * Tests import `testEnv` to check against, instead of repeating its values.
 */
export const testEnv = {
  // Node
  APP_ENV: 'development',
  HOST: '127.0.0.1',
  NODE_ENV: 'test',
  PORT: '4076',
  TZ: 'UTC',

  // App
  APP_KEY: 'test-key-not-secret-0123456789abcdef',
  APP_URL: 'http://127.0.0.1:4076',
  LOG_LEVEL: 'silent',

  // Session
  SESSION_DRIVER: 'memory',

  // Database, migrated fresh by `tests/bootstrap.ts`
  DATABASE_PATH: './tmp/test.sqlite3',

  // AT Protocol OAuth
  ALLOW_EXTERNAL_LOGINS: 'false',
  ATPROTO_HANDLE_DOMAIN: 'pds.example.com',
  MIGRATION_SERVICE: 'https://move.example.com/',
  OAUTH_SERVICE: 'https://pds.example.com/',

  // OAuth 2.0 server
  OAUTH2_ALLOWED_DIDS: 'did:web:a.com',
  OAUTH2_CLIENT_CONNECT_URL: 'https://client.example.com/connect',
  OAUTH2_CLIENT_ID: 'client',
  OAUTH2_CLIENT_NAME: 'Client',
  OAUTH2_CLIENT_REDIRECT_URIS: 'https://client.example.com/callback',
  OAUTH2_CLIENT_SECRET: 'secret-not-secret',

  // Off in tests
  OTEL_ENABLED: 'false',
  PLAUSIBLE_ENABLED: 'false',
} as const

// Does not exist.
process.env.ENV_PATH = 'tests/no-env-files'

const logLevel = process.env.LOG_LEVEL
Object.assign(process.env, testEnv)
if (logLevel) process.env.LOG_LEVEL = logLevel
