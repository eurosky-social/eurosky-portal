import { AtprotoUser } from '@thisismissem/adonisjs-atproto-oauth'
import logger from '@adonisjs/core/services/logger'

import * as lexicon from '#lexicons'
import Account from '#models/account'
import { Monocle } from '@monocle.sh/adonisjs-agent'

export type Profile = lexicon.app.bsky.actor.defs.ProfileViewDetailed

AtprotoUser.getter('authorizationServer', function (this: AtprotoUser) {
  return this.session.server.issuer
})

AtprotoUser.macro('getAccount', async function getAccount(this: AtprotoUser) {
  return Account.findOrFail(this.did)
})

AtprotoUser.macro(
  'fetchProfile',
  async function fetchProfile(this: AtprotoUser, options: { signal?: AbortSignal }) {
    const response = await this.client
      .xrpc(lexicon.app.bsky.actor.getProfile, {
        params: { actor: this.did },
        signal: options.signal,
      })
      .catch(async (error) => {
        logger.error(error)
        Monocle.captureException(error, {
          tags: { component: 'atprotouser' },
          extra: { actor: this.did },
        })
        return undefined
      })

    if (!response || !response.success) {
      return undefined
    }

    return response.body
  }
)

declare module '@thisismissem/adonisjs-atproto-oauth' {
  interface AtprotoUser {
    getAccount(): Promise<Account>
    fetchProfile(options: { signal?: AbortSignal }): Promise<undefined | Profile>
    get authorizationServer(): string
  }
}
