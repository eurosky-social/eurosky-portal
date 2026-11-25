import { type ChildProcess, spawn } from 'node:child_process'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { createInterface } from 'node:readline'
import { Client, type DidString, type HandleString } from '@atproto/lex'
import * as lexicon from '#lexicons/index'

/**
 * Account on the PDS of the tests.
 */
export interface PdsAccount {
  /**
   * Access token, for `authorization: Bearer …`.
   */
  accessJwt: string

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
 * Accounts created in tests, by DID.
 */
const accounts = new Map<string, PdsAccount>()

/**
 * URL of the PDS of the tests, while started.
 */
let url: string | undefined

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
    url = new URL(String(line)).href
  } catch (error) {
    await stop(server)
    throw error
  }

  return async function () {
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
 * Create an account on the PDS of the tests, with a random handle.
 *
 * @returns
 *   Account.
 */
export async function createAccount(): Promise<PdsAccount> {
  const name = 't' + randomUUID().slice(0, 8)
  const client = new Client({ service: pdsUrl() })
  const { body } = await client.xrpc(lexicon.com.atproto.server.createAccount.main, {
    body: { email: name + '@example.com', handle: `${name}.test`, password: randomUUID() },
  })

  const account = { accessJwt: body.accessJwt, did: body.did, handle: body.handle }
  accounts.set(account.did, account)
  return account
}

/**
 * Get an account created with {@linkcode createAccount}.
 *
 * @param did
 *   DID.
 * @returns
 *   Account.
 */
export function getAccount(did: string): PdsAccount {
  const account = accounts.get(did)
  if (!account) throw new Error('Cannot find account `' + did + '`')
  return account
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
