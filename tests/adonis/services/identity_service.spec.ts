import { test } from '@japa/runner'
import IdentityService from '#services/identity_service'
import { testEnv } from '../../env.ts'
import { setEnv } from '../helpers.ts'

// Not the one tests swap in (see `tests/pds.ts`).
const identity = new IdentityService()

test.group('services / identity', function () {
  for (const url of [
    'http://example.com/',
    'https://example.com:8443/',
    'https://127.0.0.1/',
    'https://[::1]/',
    'https://10.0.0.1/',
    'https://169.254.169.254/latest/meta-data/',
    'https://localhost/',
  ]) {
    test(`should not fetch \`${url}\``, async function ({ assert }) {
      assert.match(await rejection(identity.fetch(url)), refused)
    })
  }

  test('should not resolve DIDs on local hosts', async function ({ assert }) {
    assert.match(await rejection(identity.resolveDid('did:web:localhost%3A3000')), refused)
  })

  test('should only read from our PDS w/o external logins', async function ({ assert }) {
    const other = 'https://pds.other.example/'

    assert.deepEqual([...(identity.pdsOrigins ?? [])], [new URL(testEnv.OAUTH_SERVICE).origin])
    assert.match(await rejection(identity.pdsFetch(other)), /not ours/)
    assert.match(await rejection(identity.pdsFetch(new Request(other))), /not ours/)
  })

  test('should read from any PDS w/ external logins', function ({ assert, cleanup }) {
    cleanup(setEnv('ALLOW_EXTERNAL_LOGINS', true))

    assert.isUndefined(new IdentityService().pdsOrigins)
  })
})

/**
 * Refused by policy, not because nothing is listening.
 */
const refused = /forbidden protocol|custom https: ports|non-unicast address|not a public domain/i

/**
 * Get why a promise rejects: the messages of the error and its causes.
 */
async function rejection(promise: Promise<unknown>): Promise<string> {
  let error: unknown

  try {
    await promise
    return ''
  } catch (caught) {
    error = caught
  }

  let message = ''

  while (error instanceof Error) {
    message += error.message + '\n'
    error = error.cause
  }

  return message
}
