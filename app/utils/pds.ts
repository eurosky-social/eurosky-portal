import cache from '@adonisjs/cache/services/main'
import app from '@adonisjs/core/services/app'
import { Client, type DidString } from '@atproto/lex'
import IdentityService from '#services/identity_service'

/**
 * Build an unauthenticated client for the PDS of a DID.
 *
 * @param did
 *   DID.
 * @returns
 *   Promise that resolves to a client and the PDS it talks to.
 * @throws
 *   When the DID or its PDS cannot be resolved.
 */
export async function pdsClient(did: DidString): Promise<{ client: Client; pds: string }> {
  const identity = await app.container.make(IdentityService)
  const { pds } = await cache.getOrSet({
    factory: () => identity.resolveDid(did),
    grace: '10m',
    key: `pds-resolve:${did}`,
    ttl: '10m',
  })
  return { client: new Client({ fetch: identity.pdsFetch, service: pds }), pds }
}

/**
 * Get a client for the repo of a person with their PDS session.
 *
 * @param did
 *   DID of the person.
 * @returns
 *   Client.
 * @throws
 *   When there is no session or it cannot be restored.
 */
export async function pdsSessionClient(did: DidString): Promise<Client> {
  const { client } = await app.container.make('atproto.oauth.client')
  return new Client(await client.restore(did))
}
