import cache from '@adonisjs/cache/services/main'
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
