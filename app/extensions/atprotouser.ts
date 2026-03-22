import { AtprotoUser } from '@thisismissem/adonisjs-atproto-oauth'
import logger from '@adonisjs/core/services/logger'
import { type l, type AtIdentifierString } from '@atproto/lex'

import * as lexicon from '#lexicons'

export type Profile = lexicon.app.bsky.actor.defs.ProfileViewDetailed

AtprotoUser.getter('authorizationServer', function (this: AtprotoUser) {
  return this.session.server.issuer
})

AtprotoUser.macro(
  'fetchProfile',
  async function fetchProfile(this: AtprotoUser, actor: AtIdentifierString) {
    const profile = await this.client
      .xrpc(lexicon.app.bsky.actor.getProfile, {
        params: { actor: actor },
      })
      .catch(async (error) => {
        logger.error(error)
        return undefined
      })

    if (profile?.success) {
      // Bluesky AppView will return handle.invalid for accounts it doesn't know about:
      if (profile.body.handle === 'handle.invalid') {
        const miniDoc = await slingshotMiniProfile(actor)
        return {
          ...profile.body,
          handle: miniDoc.handle,
        }
      }

      return profile.body
    } else {
      const miniDoc = await slingshotMiniProfile(actor)
      return {
        did: miniDoc.did,
        handle: miniDoc.handle,
      }
    }
  }
)

async function slingshotMiniProfile(
  actor: AtIdentifierString
): Promise<{ did: l.DidString; handle: l.HandleString }> {
  const url = new URL(
    'https://slingshot.microcosm.blue/xrpc/blue.microcosm.identity.resolveMiniDoc'
  )
  url.searchParams.set('identifier', actor)

  const res = await fetch(url)
  const json = await res.json()

  if (!res.ok) {
    throw new Error('Unable to resolve identity with slingshot')
  }

  const result = json as { did: l.DidString; handle: l.HandleString }
  return {
    did: result.did,
    handle: result.handle,
  }
}

declare module '@thisismissem/adonisjs-atproto-oauth' {
  interface AtprotoUser {
    fetchProfile(actor: AtIdentifierString): Promise<undefined | Profile>
    get authorizationServer(): string
  }
}
