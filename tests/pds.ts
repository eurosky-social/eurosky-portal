import { type ChildProcess, spawn } from 'node:child_process'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { request } from 'node:http'
import { createInterface } from 'node:readline'
import app from '@adonisjs/core/services/app'
import type { ContainerBindings } from '@adonisjs/core/types'
import { XrpcHandleResolver } from '@atcute/identity-resolver'
import { Client, type DidString, type HandleString } from '@atproto/lex'
import { buildAtprotoLoopbackClientMetadata, NodeOAuthClient } from '@atproto/oauth-client-node'
import * as lexicon from '#lexicons/index'
import IdentityService from '#services/identity_service'
import env from '#start/env'

/**
 * Account on the PDS of the tests.
 */
interface PdsAccount {
  /**
   * Access token, for `authorization: Bearer …`.
   */
  accessJwt: string

  /**
   * Cookies of the signed-in browser.
   */
  cookies: Map<string, string>

  /**
   * DID.
   */
  did: DidString

  /**
   * Handle.
   */
  handle: HandleString
}

/**
 * Path of the API of the pages of the PDS.
 */
const api = '/@atproto/oauth-provider/~api'

/**
 * Accounts created in tests, by DID.
 */
const accounts = new Map<string, PdsAccount>()

/**
 * URL of the PDS of the tests, while started.
 */
let url: string | undefined

/**
 * AT Protocol OAuth client of the tests, while started.
 */
let oauth: NodeOAuthClient | undefined

/**
 * Start a real PDS (and PLC directory) for tests, in its own process (see
 * `tests/pds_server.ts`);
 * runs once for all tests.
 *
 * @returns
 *   Function to stop it.
 */
export async function startPds(): Promise<() => Promise<undefined>> {
  const server = spawn(process.execPath, ['tests/pds_server.ts'], {
    stdio: ['ignore', 'pipe', 'inherit'],
  })

  try {
    const [line] = await Promise.race([
      once(createInterface({ input: server.stdout }), 'line'),
      once(server, 'exit').then(function () {
        throw new Error('PDS of the tests stopped while starting')
      }),
    ])
    const [pds = '', plc = ''] = String(line).split(' ')
    url = new URL(pds).href
    const identity = new IdentityService()
    // Local, and handles of the PDS are not in DNS.
    identity.fetch = globalThis.fetch
    identity.handleResolver = new XrpcHandleResolver({ serviceUrl: url })
    identity.pdsOrigins = new Set([new URL(url).origin])
    identity.plcUrl = new URL(plc).href
    app.container.swap(IdentityService, () => identity)

    const config = await app.container.make('atproto.oauth.config')
    env.set('OAUTH_SERVICE', url)
    oauth = new NodeOAuthClient({
      allowHttp: true,
      clientMetadata: buildAtprotoLoopbackClientMetadata({
        redirect_uris: [new URL('/oauth/callback', env.get('APP_URL')).href],
        scope: config.metadata.scope,
      }),
      handleResolver: url,
      plcDirectoryUrl: identity.plcUrl,
      sessionStore: config.stores.sessions,
      stateStore: config.stores.states,
    })
    app.container.bindValue('atproto.oauth.client', {
      client: oauth,
    } as unknown as ContainerBindings['atproto.oauth.client'])
  } catch (error) {
    await stop(server)
    throw error
  }

  return async function () {
    app.container.restore(IdentityService)
    oauth = undefined
    url = undefined
    await stop(server)
  }
}

/**
 * Get the URL of the PDS of the tests.
 *
 * @returns
 *   URL.
 */
export function pdsUrl(): string {
  if (!url) throw new Error('Expected the PDS to be started (see `tests/bootstrap.ts`)')
  return url
}

/**
 * Made but unused accounts.
 */
const pool: Array<PdsAccount> = []
const poolSize = 10

/**
 * Get a new account on the PDS of the tests, with a random handle, signed in
 * on its own browser.
 *
 * @returns
 *   Account.
 */
export async function createAccount(): Promise<PdsAccount> {
  if (pool.length === 0) {
    pool.push(...(await Promise.all(Array.from({ length: poolSize }, makeAccount))))
  }

  const account = pool.pop()
  if (!account) throw new Error('Expected account')
  accounts.set(account.did, account)
  return account
}

/**
 * Make an account and sign in on the account page of the PDS.
 */
async function makeAccount(): Promise<PdsAccount> {
  const name = 't' + randomUUID().slice(0, 8)
  const password = randomUUID()
  const client = new Client({ service: pdsUrl() })
  const { body } = await client.xrpc(lexicon.com.atproto.server.createAccount.main, {
    body: { email: name + '@example.com', handle: `${name}.test`, password },
  })
  const cookies = new Map<string, string>()
  const page = new URL('/account', pdsUrl())

  await browse(cookies, page, page)
  await browse(cookies, page, api + '/sign-in', {
    identifier: body.handle,
    locale: 'en',
    password,
    remember: true,
  })

  return { accessJwt: body.accessJwt, cookies, did: body.did, handle: body.handle }
}

/**
 * Get an account created with {@linkcode createAccount}.
 *
 * @param did
 *   DID.
 * @returns
 *   Account.
 */
function getAccount(did: string): PdsAccount {
  const account = accounts.get(did)
  if (!account) throw new Error('Cannot find account `' + did + '`')
  return account
}

/**
 * Get the test client.
 *
 * @returns
 *   OAuth client.
 */
export function oauthClient(): NodeOAuthClient {
  if (!oauth) throw new Error('Expected the PDS to be started (see `tests/bootstrap.ts`)')
  return oauth
}

/**
 * Answer an authorization request as a person in a browser would: allow or deny.
 *
 * @param authorizeUrl
 *   URL the app sends the person to.
 * @param did
 *   DID of the account.
 * @param options
 *   Configuration: whether to deny, or scopes to grant (default: those asked
 *   for).
 * @returns
 *   Parameters the PDS sends the person back to the app with.
 */
export async function authorize(
  authorizeUrl: URL,
  did: string,
  options: { deny?: boolean; scope?: string } = {}
): Promise<URLSearchParams> {
  const { deny = false, scope } = options
  const { cookies } = getAccount(did)

  await browse(cookies, authorizeUrl, authorizeUrl)
  const answer = await browse(
    cookies,
    authorizeUrl,
    api + (deny ? '/reject' : '/consent'),
    deny ? {} : { did, scope }
  )
  if (typeof answer.url !== 'string') throw new Error('Expected a redirect')

  return new URL(answer.url).searchParams
}

/**
 * Open a page of the PDS or call its API from that page as a browser does,
 * keeping cookies.
 */
function browse(
  cookies: Map<string, string>,
  page: URL,
  url: URL | string,
  body?: object
): Promise<Record<string, unknown>> {
  const { promise, reject, resolve } = Promise.withResolvers<Record<string, unknown>>()
  const target = new URL(url, pdsUrl())
  // Check headers that `fetch` does not allow (`sec-fetch-*`) so `node:http`.
  const outgoing = request(
    target,
    {
      headers: {
        cookie: [...cookies].map(([key, value]) => key + '=' + value).join('; '),
        ...(body
          ? {
              'content-type': 'application/json',
              'origin': target.origin,
              'referer': page.href,
              'sec-fetch-mode': 'same-origin',
              'sec-fetch-site': 'same-origin',
              'x-csrf-token': cookies.get('csrf-token') ?? '',
            }
          : {
              'accept': 'text/html',
              'sec-fetch-dest': 'document',
              'sec-fetch-mode': 'navigate',
              'sec-fetch-site': 'cross-site',
            }),
      },
      method: body ? 'POST' : 'GET',
    },
    function (response) {
      for (const cookie of response.headers['set-cookie'] ?? []) {
        const [pair = ''] = cookie.split(';')
        const index = pair.indexOf('=')
        cookies.set(pair.slice(0, index), pair.slice(index + 1))
      }

      let text = ''
      response.setEncoding('utf8')
      response.on('data', function (chunk: string) {
        text += chunk
      })
      response.on('end', function () {
        if ((response.statusCode ?? 500) >= 400) {
          reject(
            new Error(`Cannot browse \`${target.pathname}\` (${response.statusCode}): ${text}`)
          )
        } else {
          resolve(body ? JSON.parse(text) : {})
        }
      })
    }
  )

  outgoing.on('error', reject)
  outgoing.end(body ? JSON.stringify(body) : undefined)
  return promise
}

/**
 * Stop the PDS process.
 */
async function stop(server: ChildProcess): Promise<undefined> {
  if (server.exitCode !== null) return
  const exited = once(server, 'exit')
  server.kill('SIGTERM')
  await exited
}
