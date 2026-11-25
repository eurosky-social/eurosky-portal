import testUtils from '@adonisjs/core/services/test_utils'
import i18nManager from '@adonisjs/i18n/services/main'
import { test } from '@japa/runner'
import Account from '#models/account'
import { createAccount, oauthClient, pdsUrl } from '../pds.ts'
import { logIn, prepareLogIn, signIn, startLogIn } from './helpers.ts'

const i18n = i18nManager.locale(i18nManager.defaultLocale)

test.group('logging in and out', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should log in, storing the handle', async function ({ assert, cleanup, client }) {
    const { did, handle } = await signIn({ handle: null })
    await prepareLogIn(did, cleanup)
    const response = await logIn(client, did)
    const account = await Account.findOrFail(did)

    response.assertHeader('location', '/dashboard')
    // Resolved and checked with the PDS of the tests.
    assert.equal(account.handle, handle)
  })

  test('should start logging in with a DID at its PDS', async function ({ assert, client }) {
    const { did } = await createAccount()
    const response = await startLogIn(client, did)
    const location = new URL(response.header('x-inertia-location') ?? '')

    assert.equal(location.origin + location.pathname, new URL('/oauth/authorize', pdsUrl()).href)
  })

  test('should not start logging in at other services', async function ({ client }) {
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
  })

  test('should limit logging in from one IP w/ forms', async function ({ client }) {
    const { did } = await createAccount()
    for (let index = 0; index < 10; index++) await request()
    const response = await request()

    response.assertFlashMessage('errorMessage', { key: 'errors.E_TOO_MANY_REQUESTS' })

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
    const { did } = await createAccount()
    for (let index = 0; index < 10; index++) await request()
    const response = await request()

    response.assertStatus(429)

    function request() {
      return client.post('/oauth/login').form({ input: did }).withCsrfToken().redirects(0)
    }
  })

  test('should end the session on the PDS when logging out', async function ({ assert, client }) {
    const { did, user } = await signIn()
    await client.post('/oauth/logout').withCsrfToken().loginAs(user).redirects(0)

    await assert.rejects(function () {
      return oauthClient().restore(did)
    })
  })
})
