import cache from '@adonisjs/cache/services/main'
import type { Env } from '@adonisjs/core/env'
import app from '@adonisjs/core/services/app'
import type { ContainerBindings } from '@adonisjs/core/types'
import { Client, type DidString, type HandleString } from '@atproto/lex'
import type { NodeOAuthClient, OAuthSession } from '@atproto/oauth-client-node'
import { AtprotoUser } from '@thisismissem/adonisjs-atproto-oauth'
import { DateTime } from 'luxon'
import Account from '#models/account'
import env from '#start/env'
import { createAccount, getAccount, pdsUrl } from '../pds.ts'

/**
 * Fake AT Protocol OAuth client, which {@linkcode signIn} puts in place of the
 * one of the app:
 * logging in on a PDS needs a browser,
 * so its sessions use access tokens of accounts on the PDS of the tests (see
 * `tests/pds.ts`) instead.
 *
 * Records what the app asks of it;
 * change fields to change what it does next.
 */
export interface FakeOauth {
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
   * Error requests of sessions throw, if any (such as when a session was
   * revoked while in use).
   */
  fetchError: Error | undefined

  /**
   * Error `restore` throws, if any (such as when a session expired).
   */
  restoreError: Error | undefined

  /**
   * DIDs of calls to `revoke` (logging out).
   */
  revokeCalls: Array<string>

  /**
   * Space-separated scopes granted to sessions;
   * not enforced, as sessions use access tokens with full access.
   */
  scope: string
}

/**
 * Signed in person.
 */
export interface SignedIn {
  /**
   * DID of the account.
   */
  did: DidString

  /**
   * Handle of the account on the PDS.
   */
  handle: HandleString

  /**
   * Fake AT Protocol OAuth client.
   */
  oauth: FakeOauth

  /**
   * Client for the repo of the account, to check what the app did.
   */
  repo: Client

  /**
   * User, to pass to `loginAs` of a request.
   */
  user: AtprotoUser
}

/**
 * Configuration for {@linkcode signIn}.
 */
interface SignInOptions {
  /**
   * Handle of the account in the database of the app (default: the handle on
   * the PDS);
   * `null` for none.
   */
  handle?: HandleString | null

  /**
   * Space-separated scopes granted on the PDS (default: `'atproto'`).
   */
  scope?: string
}

/**
 * Issuer of the OAuth server, as the fake client reports it.
 */
const issuer = env.get('OAUTH_SERVICE')

/**
 * AT Protocol OAuth client of the app, to put back in {@linkcode restoreOauth}.
 *
 * Not configured in tests (the app only does that in the `web` environment;
 * configuring uses the network),
 * so {@linkcode signIn} replaces it instead of its methods.
 */
const realOauth = await app.container.make('atproto.oauth.client')

/**
 * Undo {@linkcode signIn}: put the AT Protocol OAuth client of the app back.
 *
 * @returns
 *   Nothing.
 */
export function restoreOauth(): undefined {
  app.container.bindValue('atproto.oauth.client', realOauth)
}

/**
 * Create an account on the PDS of the tests that accepted the terms, and sign
 * in to it with a {@linkcode FakeOauth} client;
 * undo with {@linkcode restoreOauth}.
 *
 * @param options
 *   Configuration.
 * @returns
 *   Signed in person.
 */
export async function signIn(options: SignInOptions = {}): Promise<SignedIn> {
  const account = await createAccount()
  const { did } = account
  const { handle = account.handle, scope = 'atproto' } = options
  const legal = {
    effectiveAt: '2026-01-01',
    tree: { children: [{ type: 'text', value: 'a' }], type: 'root' },
  }

  await cache.set({ key: 'legal:privacy', value: legal })
  await cache.set({ key: 'legal:terms', value: legal })
  await Account.create({ did, handle, termsAcceptedAt: DateTime.now() })

  const oauth: FakeOauth = {
    authorizeCalls: [],
    authorizeError: undefined,
    callbackDid: did,
    callbackError: undefined,
    fetchError: undefined,
    restoreError: undefined,
    revokeCalls: [],
    scope,
  }

  const methods = {
    async authorize(input, authorizeOptions) {
      if (oauth.authorizeError) throw oauth.authorizeError
      oauth.authorizeCalls.push({ input, scope: authorizeOptions?.scope })
      return new URL('/oauth/authorize', issuer)
    },
    async callback(parameters) {
      if (oauth.callbackError) throw oauth.callbackError
      return { session: createSession(oauth.callbackDid), state: parameters.get('state') }
    },
    async restore(identifier) {
      if (oauth.restoreError) throw oauth.restoreError
      return createSession(identifier)
    },
    async revoke(identifier) {
      oauth.revokeCalls.push(identifier)
    },
  } satisfies Pick<NodeOAuthClient, 'authorize' | 'callback' | 'restore' | 'revoke'>

  const client = {
    ...methods,
    // Finding the PDS of a service needs the network: fail, as if it is down.
    oauthResolver: {
      // The account signed in to, as the network would resolve it.
      async resolveFromIdentity() {
        return {
          identityInfo: { did, handle: account.handle },
          metadata: { issuer },
          pds: new URL(pdsUrl()),
        }
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

  return {
    did,
    handle: account.handle,
    oauth,
    repo: new Client(createSession(did)),
    user: new AtprotoUser(createSession(did)),
  }

  /**
   * Create a session for an account, with the scopes of the PDS at the time
   * they are asked for.
   */
  function createSession(sessionDid: string): OAuthSession {
    const sessionAccount = getAccount(sessionDid)

    const session = {
      did: sessionAccount.did,
      server: { issuer },
      sub: sessionAccount.did,
      async fetchHandler(pathname: string, init?: RequestInit) {
        if (oauth.fetchError) throw oauth.fetchError

        const headers = new Headers(init?.headers)
        headers.set('authorization', 'Bearer ' + sessionAccount.accessJwt)
        return fetch(new URL(pathname, pdsUrl()), { ...init, headers })
      },
      async getTokenInfo() {
        return { aud: issuer, iss: issuer, scope: oauth.scope, sub: sessionAccount.did }
      },
    }

    // Only what the app uses of a session:
    // a real one needs a server agent, with DPoP keys and server metadata.
    return session as unknown as OAuthSession
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
