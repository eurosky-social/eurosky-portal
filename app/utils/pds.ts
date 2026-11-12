import cache from '@adonisjs/cache/services/main'
import app from '@adonisjs/core/services/app'
import { Client, type DidString } from '@atproto/lex'
import { SlingshotService } from '#services/slingshot_service'

/**
 * Resolve PDSes of DIDs so their repos can be read publicly.
 */
const slingshot = new SlingshotService()

/**
 * Build an unauthenticated client for the PDS of a DID.
 *
 * @param did
 *   DID.
 * @returns
 *   Promise that resolves to a client and the PDS it talks to.
 */
export async function pdsClient(did: DidString): Promise<{ client: Client; pds: string }> {
  const resolved = await cache.getOrSet({
    factory: (ctx) =>
      slingshot.resolveMiniDoc(did, AbortSignal.timeout(5000)).then((r) => r ?? ctx.skip()),
    grace: '10m',
    key: `pds-resolve:${did}`,
    ttl: '10m',
  })
  if (!resolved) throw new Error(`Cannot resolve PDS for \`${did}\``)
  return { client: new Client(resolved.pds), pds: resolved.pds }
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
