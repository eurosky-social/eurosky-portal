import { AtprotoUser } from '@thisismissem/adonisjs-atproto-oauth'
import type { l, AtIdentifierString } from '@atproto/lex'
import { XrpcInvalidResponseError } from '@atproto/lex'
import * as lexicon from '#lexicons'
import logger from '@adonisjs/core/services/logger'

export type Profile = lexicon.app.bsky.actor.defs.ProfileViewDetailed

AtprotoUser.macro(
  'fetchProfile',
  async function fetchProfile(this: AtprotoUser, actor: AtIdentifierString) {
    try {
      const profile = await this.client.xrpc(lexicon.app.bsky.actor.getProfile, {
        params: { actor: actor },
      })

      if (profile?.success) {
        return profile.body
      }
    } catch (error) {
      if (error instanceof XrpcInvalidResponseError) {
        try {
          const res = await fetch(
            `https://slingshot.microcosm.blue/xrpc/blue.microcosm.identity.resolveMiniDoc?identifier=${actor}`
          )
          if (!res.ok) {
            throw new Error('Unable to resolve identity')
          }

          const identity = (await res.json()) as { did: l.DidString; handle: l.HandleString }
          return {
            did: identity.did,
            handle: identity.handle,
          }
        } catch (err) {
          logger.error(err, 'Error fetching profile from slingshot')
          throw err
        }
      } else {
        logger.error(error, 'Error fetching profile')
        throw error
      }
    }
  }
)

declare module '@thisismissem/adonisjs-atproto-oauth' {
  interface AtprotoUser {
    fetchProfile(actor: AtIdentifierString): Promise<undefined | Profile>
  }
}
