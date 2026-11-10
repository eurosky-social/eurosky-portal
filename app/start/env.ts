/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'
import { commaSeparated } from '#utils/env'

const validateDomain = Env.schema.string({ format: 'url', protocol: false, tld: true })

export default await Env.create(new URL('../../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // Vite
  VITE_ALIAS_HOSTS: Env.schema.string.optional(),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),
  APP_ENV: Env.schema.enum(['development', 'staging', 'production'] as const),

  // Session
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),

  // Database
  DATABASE_PATH: Env.schema.string.optional(),
  DATABASE_AUTOMIGRATE: Env.schema.boolean.optional(),

  // AT Protocol OAuth:
  // Comma-separated list of domains, the first one is the default:
  ATPROTO_HANDLE_DOMAIN: commaSeparated(validateDomain),
  ALLOW_EXTERNAL_LOGINS: Env.schema.boolean.optional(),
  // Milliseconds to resolve an identity (handle > DID > PDS > authorization server):
  ATPROTO_RESOLVE_TIMEOUT: Env.schema.number.optional(),
  OAUTH_SERVICE: Env.schema.string({ format: 'url', tld: true, protocol: true }),
  MIGRATION_SERVICE: Env.schema.string.optional({ format: 'url', tld: true, protocol: true }),
  ATPROTO_OAUTH_CLIENT_ID: Env.schema.string.optional({ format: 'url', tld: true, protocol: true }),
  ATPROTO_OAUTH_JWT_PRIVATE_KEY: Env.schema.secret.optional(),

  // OpenTelemetry for observability
  OTEL_ENABLED: Env.schema.boolean.optional(),

  // Plausible for analytics
  PLAUSIBLE_ENABLED: Env.schema.boolean.optional(),
})
