import cache from '@adonisjs/cache/services/main'
import type { Env } from '@adonisjs/core/env'
import { Client, type DidString, type HandleString } from '@atproto/lex'
import type { ApiClient, ApiResponse } from '@japa/api-client'
import { AtprotoUser } from '@thisismissem/adonisjs-atproto-oauth'
import { DateTime } from 'luxon'
import Account from '#models/account'
import jetstreamService from '#services/jetstream_service'
import env from '#start/env'
import { authorize, createAccount, oauthClient, pdsUrl } from '../pds.ts'

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
   * Client for the repo of the account, with full access (not OAuth), to
   * arrange and check things, as other apps would.
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
   * Space-separated scopes to grant (default: `'atproto'`).
   */
  scope?: string
}

/**
 * Create an account on the PDS of the tests that accepted the terms, and log
 * in to it with OAuth.
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

  const client = oauthClient()
  const { session } = await client.callback(
    await authorize(await client.authorize(did, { scope }), did)
  )

  return {
    did,
    handle: account.handle,
    repo: new Client({
      did,
      headers: { authorization: 'Bearer ' + account.accessJwt },
      service: pdsUrl(),
    }),
    user: new AtprotoUser(session),
  }
}

/**
 * Configuration for {@linkcode answerOnPds}.
 */
interface AnswerOptions {
  /**
   * DID of the account to sign in to on the PDS (default: the one asked for).
   */
  as?: DidString

  /**
   * Whether to deny.
   */
  deny?: boolean

  /**
   * Scopes to grant (default: those asked for).
   */
  scope?: string

  /**
   * Session values to change when coming back.
   */
  session?: Record<string, unknown>

  /**
   * Signed in user, when coming back.
   */
  user?: AtprotoUser
}

/**
 * Answer on the PDS of the tests, where a response of the app sends the person
 * to, and come back to the app with that answer.
 *
 * @param client
 *   Client of the test.
 * @param response
 *   Response that sends the person to the PDS.
 * @param did
 *   DID of the account asked for.
 * @param options
 *   Configuration.
 * @returns
 *   Response of the callback.
 */
export async function answerOnPds(
  client: ApiClient,
  response: ApiResponse,
  did: DidString,
  options: AnswerOptions = {}
): Promise<ApiResponse> {
  const location = response.header('x-inertia-location') ?? response.header('location') ?? ''
  const parameters = await authorize(new URL(location), options.as ?? did, options)
  const callback = client
    .get('/oauth/callback')
    .qs(Object.fromEntries(parameters))
    .withSession({ ...response.session(), ...options.session })
    .redirects(0)

  return options.user ? callback.loginAs(options.user) : callback
}

/**
 * Start logging in to an account on the PDS of the tests at the login form.
 *
 * @param client
 *   Client of the test.
 * @param did
 *   DID of the account.
 * @returns
 *   Response, which sends the person to the PDS.
 */
export function startLogIn(client: ApiClient, did: DidString): Promise<ApiResponse> {
  return client.post('/oauth/login').form({ input: did }).withCsrfToken().withInertia().redirects(0)
}

/**
 * Prepare logging in: mark the account as synced, so that no backfill is
 * queued, and do not watch it, as that connects to Jetstream.
 *
 * @param did
 *   DID of the account.
 * @param cleanup
 *   Cleanup function of the test.
 * @returns
 *   Nothing.
 */
export async function prepareLogIn(
  did: DidString,
  cleanup: (handler: () => void) => void
): Promise<undefined> {
  const account = await Account.findOrFail(did)
  await account.merge({ lastActivitySyncAt: DateTime.now() }).save()
  jetstreamService.addDid = function () {}
  cleanup(function () {
    Reflect.deleteProperty(jetstreamService, 'addDid')
  })
}

/**
 * Log in to an account on the PDS of the tests through the app, as a person
 * would: start at the login form, allow on the PDS, and come back.
 *
 * @param client
 *   Client of the test.
 * @param did
 *   DID of the account.
 * @returns
 *   Response of the callback.
 */
export async function logIn(client: ApiClient, did: DidString): Promise<ApiResponse> {
  return answerOnPds(client, await startLogIn(client, did), did)
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
