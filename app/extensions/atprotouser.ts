import { AtprotoUser } from '@thisismissem/adonisjs-atproto-oauth'
import logger from '@adonisjs/core/services/logger'
import { type l, type AtIdentifierString, XrpcResponse } from '@atproto/lex'
import { XrpcInvalidResponseError } from '@atproto/lex'

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
        // Fixes: XrpcInvalidResponseError: Invalid response:
        //   Invalid datetime at $.createdAt (got "0001-01-01T00:00:00.000Z")
        if (error instanceof XrpcInvalidResponseError) {
          return slingshotMiniProfile(actor)
        }

        // Otherwise log and rethrow the error:
        logger.error(error)
        throw error
      })

    if (profile?.success) {
      return profile.body
    }
  }
)

async function slingshotMiniProfile(
  actor: AtIdentifierString
): Promise<XrpcResponse<typeof lexicon.app.bsky.actor.getProfile.main>> {
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
  return new XrpcResponse(lexicon.app.bsky.actor.getProfile.main, res.status, res.headers, {
    encoding: 'application/json',
    body: {
      did: result.did,
      handle: result.handle,
    },
  })
}

declare module '@thisismissem/adonisjs-atproto-oauth' {
  interface AtprotoUser {
    fetchProfile(actor: AtIdentifierString): Promise<undefined | Profile>
    get authorizationServer(): string
  }
}
