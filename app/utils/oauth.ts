import env from '#start/env'

/**
 * Scope to favorite apps on atstore;
 * requested when needed.
 */
export const favoriteScope = 'repo:fyi.atstore.listing.favorite?action=create&action=delete'

/**
 * Scopes requested when logging in.
 *
 * See: https://atproto.com/guides/scopes
 */
export const loginScopes = [
  'atproto',
  'rpc:app.bsky.actor.getProfile?aud=did:web:api.bsky.app%23bsky_appview',
]

export function getHandleDomain(): string | undefined {
  let value = env.get('ATPROTO_HANDLE_DOMAIN')
  if (!value) {
    return undefined
  }
  if (value.startsWith('.')) {
    return value
  }
  return '.' + value
}
