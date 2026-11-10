import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Account from '#models/account'
import jetstreamService from '#services/jetstream_service'
import { restorePds, signIn } from './helpers.ts'

const did = 'did:web:a.com'

test.group('logging in and out', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })
  group.each.teardown(restorePds)

  test('should log in', async function ({ cleanup, client }) {
    await signIn({ did })
    // Already synced, so no backfill is queued.
    const account = await Account.findOrFail(did)
    await account.merge({ lastActivitySyncAt: DateTime.now() }).save()
    // Watching DIDs connects to Jetstream.
    jetstreamService.addDid = function () {}
    cleanup(function () {
      Reflect.deleteProperty(jetstreamService, 'addDid')
    })
    const response = await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'd' })
      .withSession({ oauth_state: 'd', source: 'login' })
      .redirects(0)

    response.assertHeader('location', '/dashboard')
  })

  test('should end the session on the PDS when logging out', async function ({ assert, client }) {
    const { revokeCalls, user } = await signIn({ did })
    await client.post('/oauth/logout').withCsrfToken().loginAs(user).redirects(0)

    assert.deepEqual(revokeCalls, [did])
  })
})
