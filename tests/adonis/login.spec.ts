import testUtils from '@adonisjs/core/services/test_utils'
import i18nManager from '@adonisjs/i18n/services/main'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Account from '#models/account'
import jetstreamService from '#services/jetstream_service'
import { restoreOauth, signIn } from './helpers.ts'

const i18n = i18nManager.locale(i18nManager.defaultLocale)

test.group('logging in and out', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })
  group.each.teardown(restoreOauth)

  test('should log in, storing the handle', async function ({ assert, cleanup, client }) {
    const { did, handle } = await signIn({ handle: null })
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
    await account.refresh()

    response.assertHeader('location', '/dashboard')
    assert.equal(account.handle, handle)
  })

  test('should start logging in with a DID', async function ({ assert, client }) {
    const { did, oauth } = await signIn()
    await client
      .post('/oauth/login')
      .form({ input: did })
      .withCsrfToken()
      .withInertia()
      .redirects(0)

    assert.deepEqual(
      oauth.authorizeCalls.map(function (d) {
        return d.input
      }),
      [did]
    )
  })

  test('should not start logging in at other services', async function ({ assert, client }) {
    const { oauth } = await signIn()
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
    assert.deepEqual(oauth.authorizeCalls, [])
  })

  test('should limit logging in from one IP w/ forms', async function ({ assert, client }) {
    const { did, oauth } = await signIn()
    for (let index = 0; index < 10; index++) await request()
    const response = await request()

    response.assertFlashMessage('errorMessage', { key: 'errors.E_TOO_MANY_REQUESTS' })
    assert.equal(oauth.authorizeCalls.length, 10)

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
    const { did } = await signIn()
    for (let index = 0; index < 10; index++) await request()
    const response = await request()

    response.assertStatus(429)

    function request() {
      return client.post('/oauth/login').form({ input: did }).withCsrfToken().redirects(0)
    }
  })

  test('should end the session on the PDS when logging out', async function ({ assert, client }) {
    const { did, oauth, user } = await signIn()
    await client.post('/oauth/logout').withCsrfToken().loginAs(user).redirects(0)

    assert.deepEqual(oauth.revokeCalls, [did])
  })
})
