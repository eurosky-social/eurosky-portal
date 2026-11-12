import cache from '@adonisjs/cache/services/main'
import type { Env } from '@adonisjs/core/env'
import app from '@adonisjs/core/services/app'
import type { ContainerBindings } from '@adonisjs/core/types'
import { cidForRawBytes, type DidString, type HandleString, lexParse } from '@atproto/lex'
import type { NodeOAuthClient, OAuthSession } from '@atproto/oauth-client-node'
import { AtprotoUser } from '@thisismissem/adonisjs-atproto-oauth'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import Account from '#models/account'
import env from '#start/env'
import { testEnv } from '../env.ts'

/**
 * Fake PDS, in place of the AT Protocol OAuth client of the app:
 * it has sessions without network,
 * and records what the app asks of it.
 *
 * Change fields to change what it does next.
 */
export interface FakePds {
  /**
   * Calls to `authorize` (logging in, asking for more scopes).
   */
  authorizeCalls: Array<{ input: string; scope: string | undefined }>

  /**
   * Error `authorize` throws, if any (such as when the PDS is down).
   */
  authorizeError: Error | undefined

  /**
   * DID of the account chosen on the PDS, as the callback returns it.
   */
  callbackDid: DidString

  /**
   * Error the callback throws, if any (such as when denied).
   */
  callbackError: Error | undefined

  /**
   * Blobs uploaded to repos.
   */
  blobs: Array<{ cid: string; data: Uint8Array; mimeType: string }>

  /**
   * Records put in repos.
   */
  records: Array<{ collection: string; record?: unknown; repo: string; rkey: string }>

  /**
   * DIDs of calls to `revoke` (logging out).
   */
  revokeCalls: Array<string>

  /**
   * Space-separated scopes granted to sessions.
   */
  scope: string

  /**
   * Signed in user, to pass to `loginAs` of a request.
   */
  user: AtprotoUser

  /**
   * Whether XRPC requests to the PDS fail.
   */
  xrpcFails: boolean
}

/**
 * Configuration for {@linkcode signIn}.
 */
interface SignInOptions {
  /**
   * DID of the account.
   */
  did: DidString

  /**
   * Handle of the account (default: `a` on `ATPROTO_HANDLE_DOMAIN`).
   */
  handle?: HandleString | null

  /**
   * Space-separated scopes granted on the PDS (default: `'atproto'`).
   */
  scope?: string
}

/**
 * Input of `putRecord`, as far as the fake PDS needs it.
 */
const putRecordValidator = vine.create({
  collection: vine.string(),
  record: vine.any(),
  repo: vine.string(),
  rkey: vine.string(),
})

/**
 * Issuer of the fake PDS.
 */
const issuer = env.get('OAUTH_SERVICE')

/**
 * AT Protocol OAuth client of the app, to put back in {@linkcode restorePds}.
 *
 * Not configured in tests (the app only does that in the `web` environment;
 * configuring uses the network),
 * so {@linkcode signIn} replaces it instead of its methods.
 */
const realOauth = await app.container.make('atproto.oauth.client')

/**
 * Undo {@linkcode signIn}: put the real AT Protocol OAuth client back.
 *
 * @returns
 *   Nothing.
 */
export function restorePds(): undefined {
  app.container.bindValue('atproto.oauth.client', realOauth)
}

/**
 * Set up an account that accepted the terms and sign in to it, with a
 * {@linkcode FakePds};
 * undo with {@linkcode restorePds}.
 *
 * @param options
 *   Configuration.
 * @returns
 *   Fake PDS.
 */
export async function signIn(options: SignInOptions): Promise<FakePds> {
  const { did, handle = `a.${testEnv.ATPROTO_HANDLE_DOMAIN}`, scope = 'atproto' } = options
  const legal = {
    effectiveAt: '2026-01-01',
    tree: { children: [{ type: 'text', value: 'a' }], type: 'root' },
  }

  // Not to L2 (the database): that is locked by the global transaction.
  await cache.set({ key: 'legal:privacy', skipL2Write: true, value: legal })
  await cache.set({ key: 'legal:terms', skipL2Write: true, value: legal })
  await Account.create({ did, handle, termsAcceptedAt: DateTime.now() })

  const pds: FakePds = {
    authorizeCalls: [],
    authorizeError: undefined,
    blobs: [],
    callbackDid: did,
    callbackError: undefined,
    records: [],
    revokeCalls: [],
    scope,
    user: new AtprotoUser(createSession(did)),
    xrpcFails: false,
  }

  const methods = {
    async authorize(input, authorizeOptions) {
      if (pds.authorizeError) throw pds.authorizeError
      pds.authorizeCalls.push({ input, scope: authorizeOptions?.scope })
      return new URL('/oauth/authorize', issuer)
    },
    async callback(parameters) {
      if (pds.callbackError) throw pds.callbackError
      return { session: createSession(pds.callbackDid), state: parameters.get('state') }
    },
    async restore(identifier) {
      if (identifier !== did) throw new Error('Cannot restore `' + identifier + '`')
      return createSession(did)
    },
    async revoke(identifier) {
      pds.revokeCalls.push(identifier)
    },
  } satisfies Pick<NodeOAuthClient, 'authorize' | 'callback' | 'restore' | 'revoke'>

  const client = {
    ...methods,
    // Finding the PDS of a service needs the network: fail, as if it is down.
    oauthResolver: {
      // The account signed in to, as the network would resolve it.
      async resolveFromIdentity() {
        return { identityInfo: { did, handle }, metadata: { issuer }, pds: new URL(issuer) }
      },
      async resolveFromService(): Promise<never> {
        throw new Error('No network in tests')
      },
    },
  }

  // The binding is a class with private fields, which only a cast can make;
  // bound values take precedence over other bindings.
  app.container.bindValue('atproto.oauth.client', {
    client,
  } as unknown as ContainerBindings['atproto.oauth.client'])

  return pds

  /**
   * Create a session, with the scopes of the PDS at the time they are asked
   * for.
   */
  function createSession(sessionDid: DidString): OAuthSession {
    const session = {
      did: sessionDid,
      server: { issuer },
      sub: sessionDid,
      async fetchHandler(pathname: string, init?: RequestInit) {
        return handleXrpc(sessionDid, new URL(pathname, issuer), init)
      },
      async getTokenInfo() {
        return { aud: issuer, iss: issuer, scope: pds.scope, sub: sessionDid }
      },
    }

    // Only what the app uses of a session:
    // a real one needs a server agent, with DPoP keys and server metadata.
    return session as unknown as OAuthSession
  }

  /**
   * Answer XRPC requests to the repo, recording what was written.
   */
  async function handleXrpc(repo: DidString, url: URL, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers)

    if (pds.xrpcFails) {
      return Response.json({ error: 'InternalServerError' }, { status: 500 })
    }

    if (url.pathname === '/xrpc/com.atproto.repo.uploadBlob') {
      const data = new Uint8Array(await new Response(init?.body).arrayBuffer())
      const mimeType = headers.get('content-type') ?? 'application/octet-stream'
      const cid = await cidForRawBytes(data)
      pds.blobs.push({ cid: cid.toString(), data, mimeType })
      const blob = {
        $type: 'blob',
        mimeType,
        ref: { $link: cid.toString() },
        size: data.byteLength,
      }
      return Response.json({ blob })
    }

    if (url.pathname === '/xrpc/com.atproto.repo.putRecord') {
      const body = await new Response(init?.body).text()
      const input = await putRecordValidator.validate(lexParse(body))
      const cid = await cidForRawBytes(new TextEncoder().encode(body))
      pds.records.push(input)
      return Response.json({
        cid: cid.toString(),
        uri: `at://${repo}/${input.collection}/${input.rkey}`,
      })
    }

    return Response.json({ error: 'MethodNotImplemented' }, { status: 501 })
  }
}

/**
 * Values of environment variables, as parsed.
 */
type EnvValues = typeof env extends Env<infer Values> ? Values : never

/**
 * Set an environment variable, for code that reads it when it runs (not when
 * it loads).
 *
 * @param key
 *   Name.
 * @param value
 *   Value, as parsed (such as an array for a list), or `undefined` to unset.
 * @returns
 *   Function to put the previous value back.
 */
export function setEnv<Key extends keyof EnvValues>(
  key: Key,
  value: EnvValues[Key]
): () => undefined {
  const previous = env.get(key)
  apply(value)
  return function () {
    apply(previous)
  }

  /**
   * Apply a value.
   */
  function apply(next: EnvValues[Key]): undefined {
    env.set(key, next)
    // `process.env` turns `undefined` into `'undefined'`.
    if (next === undefined) Reflect.deleteProperty(process.env, key)
  }
}
