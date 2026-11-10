import testUtils from '@adonisjs/core/services/test_utils'
import i18nManager from '@adonisjs/i18n/services/main'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Account from '#models/account'
import jetstreamService from '#services/jetstream_service'
import { restorePds, signIn } from './helpers.ts'

const i18n = i18nManager.locale(i18nManager.defaultLocale)
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

  test('should start logging in with a DID', async function ({ assert, client }) {
    const pds = await signIn({ did })
    await client
      .post('/oauth/login')
      .form({ input: did })
      .withCsrfToken()
      .withInertia()
      .redirects(0)

    assert.deepEqual(
      pds.authorizeCalls.map(function (d) {
        return d.input
      }),
      [did]
    )
  })

  test('should not start logging in at other services', async function ({ assert, client }) {
    const pds = await signIn({ did })
    const response = await client
      .post('/oauth/login')
      .form({ input: 'https://b.example.com' })
      .withCsrfToken()
      .withInertia()
      .redirects(0)

    response.assertFlashMessage('inputErrorsBag', {
      input: [i18n.t('oauth.unsupportedAccount')],
      old_input: ['https://b.example.com'],
    })
    assert.deepEqual(pds.authorizeCalls, [])
  })

  test('should limit logging in from one IP w/ forms', async function ({ assert, client }) {
    const pds = await signIn({ did })
    for (let index = 0; index < 10; index++) await request()
    const response = await request()

    response.assertFlashMessage('errorMessage', { key: 'errors.E_TOO_MANY_REQUESTS' })
    assert.equal(pds.authorizeCalls.length, 10)

    function request() {
      return client
        .post('/oauth/login')
        .form({ input: did })
        .withCsrfToken()
        .withInertia()
        .redirects(0)
    }
  })

  test('should limit logging in from one IP outside forms', async function ({ client }) {
    await signIn({ did })
    for (let index = 0; index < 10; index++) await request()
    const response = await request()

    response.assertStatus(429)

    function request() {
      return client.post('/oauth/login').form({ input: did }).withCsrfToken().redirects(0)
    }
  })

  test('should end the session on the PDS when logging out', async function ({ assert, client }) {
    const { revokeCalls, user } = await signIn({ did })
    await client.post('/oauth/logout').withCsrfToken().loginAs(user).redirects(0)

    assert.deepEqual(revokeCalls, [did])
  })
})
