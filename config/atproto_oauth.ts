import {
  defineConfig,
  lucidSessionStore,
  lucidStateStore,
} from '@thisismissem/adonisjs-atproto-oauth'
import env from '#start/env'

export default defineConfig({
  publicUrl: env.get('APP_URL'),
  metadata: {
    // If ATPROTO_OAUTH_CLIENT_ID is set, the client metadata will be fetched from that URL:
    client_id: env.get('ATPROTO_OAUTH_CLIENT_ID'),
    client_name: 'Eurosky Portal',
    client_uri: new URL('/', env.get('APP_URL')).toString(),
    // See: https://atproto.com/guides/scopes
    scope: 'atproto',
    // logo_uri: 'https://my-app.com/logo.png',
    // tos_uri: 'https://my-app.com/tos',
    // policy_uri: 'https://my-app.com/policy',
  },

  // For a confidential client, set this environment variable:
  // Empty values are ignored
  jwks: [env.get('ATPROTO_OAUTH_JWT_PRIVATE_KEY')],
  // Models to store OAuth State and Sessions:
  stores: {
    states: lucidStateStore(() => import('#models/oauth_state')),
    sessions: lucidSessionStore(() => import('#models/oauth_session')),
  },
})
