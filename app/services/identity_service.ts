import {
  CompositeDidDocumentResolver,
  CompositeHandleResolver,
  type HandleResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  type ResolvedActor,
  WebDidDocumentResolver,
  WellKnownHandleResolver,
} from '@atcute/identity-resolver'
import { NodeDnsHandleResolver } from '@atcute/identity-resolver-node'
import { safeFetchWrap } from '@atproto-labs/fetch-node'
import type { DidString } from '@atproto/lex'
import env from '#start/env'

/**
 * Fetch for URLs that people control: HTTPS, default port, public addresses;
 * made once, as it has its own connection pool.
 */
const safeFetch = safeFetchWrap({
  allowImplicitRedirect: true,
  responseMaxSize: 10 * 1024 * 1024,
})

/**
 * Handle resolver: DNS, and `.well-known` with {@linkcode safeFetch}.
 */
const handleResolver = new CompositeHandleResolver({
  methods: {
    dns: new NodeDnsHandleResolver(),
    http: new WellKnownHandleResolver({ fetch: safeFetch }),
  },
})

/**
 * Resolve identities and read from the PDSes they point to,
 * guarding against server-side request forgery, as people control DID
 * documents and handles.
 *
 * Get it from the container, so tests can swap in one for their PDS.
 */
export default class IdentityService {
  /**
   * Fetch for DID documents and handles.
   */
  fetch: typeof globalThis.fetch = safeFetch

  /**
   * Handle resolver.
   */
  handleResolver: HandleResolver = handleResolver

  /**
   * PLC directory.
   */
  plcUrl = 'https://plc.directory'

  /**
   * Origins of PDSes to read from, `undefined` for any;
   * without external logins, only accounts on `OAUTH_SERVICE` can log in.
   */
  pdsOrigins: ReadonlySet<string> | undefined = env.get('ALLOW_EXTERNAL_LOGINS', false)
    ? undefined
    : new Set([new URL(env.get('OAUTH_SERVICE')).origin])

  /**
   * Fetch for PDSes: rejects origins not in `pdsOrigins`.
   */
  pdsFetch: typeof globalThis.fetch = async (input, init) => {
    const { origin } = new URL(input instanceof Request ? input.url : input)

    if (this.pdsOrigins && !this.pdsOrigins.has(origin)) {
      throw new Error(`Cannot read from PDS \`${origin}\`: not ours`)
    }

    return this.fetch(input, init)
  }

  /**
   * Resolve a DID to its PDS and handle;
   * the handle is `handle.invalid` when it does not resolve back to the DID.
   *
   * @param did
   *   DID.
   * @returns
   *   DID, handle, and PDS.
   * @throws
   *   When the DID or its PDS cannot be resolved.
   */
  async resolveDid(did: DidString): Promise<ResolvedActor> {
    const { fetch } = this
    const resolver = new LocalActorResolver({
      didDocumentResolver: new CompositeDidDocumentResolver({
        methods: {
          plc: new PlcDidDocumentResolver({ apiUrl: this.plcUrl, fetch }),
          web: new WebDidDocumentResolver({ fetch }),
        },
      }),
      handleResolver: this.handleResolver,
    })

    return resolver.resolve(did, {
      signal: AbortSignal.timeout(env.get('ATPROTO_RESOLVE_TIMEOUT', 5000)),
    })
  }
}
