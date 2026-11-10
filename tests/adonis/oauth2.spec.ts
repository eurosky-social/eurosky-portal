import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { OAuthCallbackError } from '@atproto/oauth-client-node'
import Account from '#models/account'
import Oauth2Grant from '#models/oauth2_grant'
import jetstreamService from '#services/jetstream_service'
import oauth2Service from '#services/oauth2_service'
import { importScopes, parseScopes, serializeScopes } from '#utils/oauth'
import { testEnv } from '../env.ts'
import { restorePds, setEnv, signIn } from './helpers.ts'

// See `tests/env.ts`.
const clientId = testEnv.OAUTH2_CLIENT_ID
const clientName = testEnv.OAUTH2_CLIENT_NAME
const clientSecret = testEnv.OAUTH2_CLIENT_SECRET
const did = testEnv.OAUTH2_ALLOWED_DIDS
const handle = `a.${testEnv.ATPROTO_HANDLE_DOMAIN}`
const redirectUri = testEnv.OAUTH2_CLIENT_REDIRECT_URIS

const authorizeQuery = {
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: 'code',
  scope: 'a',
  state: 'b',
}

const importGranted = serializeScopes(importScopes.union(new Set(['atproto'])))
const oauth2Request = { clientId, redirectUri, scope: 'a', state: 'b' }
const otherDid = 'did:web:b.com'

test.group('oauth2 / guests', function () {
  for (const path of ['/connections', '/oauth2/authorize?client_id=client']) {
    test(`should redirect \`${path}\` to \`/login\``, async function ({ assert, client }) {
      const response = await client.get(path).redirects(0)

      assert.match(response.header('location') ?? '', /^\/login(\?|$)/)
      response.assertStatus(302)
    })
  }
})

test.group('oauth2 / GET /oauth2/authorize', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })
  group.each.teardown(restorePds)

  test('should render the consent page', async function ({ client }) {
    const { user } = await signIn({ did })
    const response = await client
      .get('/oauth2/authorize')
      .qs(authorizeQuery)
      .loginAs(user)
      .withInertia()

    response.assertInertiaComponent('oauth2/authorize')
    response.assertInertiaPropsContains({ clientName, handle })
    response.assertStatus(200)
  })

  test('should keep the request in the session', async function ({ client }) {
    const { user } = await signIn({ did })
    const response = await client
      .get('/oauth2/authorize')
      .qs(authorizeQuery)
      .loginAs(user)
      .withInertia()

    response.assertSession('oauth2_request', oauth2Request)
  })

  test('should show the DID without a handle', async function ({ client }) {
    const { user } = await signIn({ did, handle: null })
    const response = await client
      .get('/oauth2/authorize')
      .qs(authorizeQuery)
      .loginAs(user)
      .withInertia()

    response.assertInertiaPropsContains({ handle: did })
  })

  test('should sort scopes', async function ({ client }) {
    const { user } = await signIn({ did })
    const response = await client
      .get('/oauth2/authorize')
      .qs({ ...authorizeQuery, scope: 'c a' })
      .loginAs(user)
      .withInertia()

    response.assertSession('oauth2_request', { ...oauth2Request, scope: 'a c' })
  })

  test('should support no scopes', async function ({ client }) {
    const { user } = await signIn({ did })
    const response = await client
      .get('/oauth2/authorize')
      .qs({ ...authorizeQuery, scope: undefined })
      .loginAs(user)
      .withInertia()

    response.assertSession('oauth2_request', { ...oauth2Request, scope: '' })
  })

  test('should show an error for an unknown client', async function ({ client }) {
    const { user } = await signIn({ did })
    const response = await client
      .get('/oauth2/authorize')
      .qs({ ...authorizeQuery, client_id: 'other' })
      .loginAs(user)
      .withInertia()

    response.assertInertiaPropsContains({ error: 'invalidClient' })
    response.assertStatus(400)
  })

  test('should show an error without a client', async function ({ cleanup, client }) {
    const { user } = await signIn({ did })
    cleanup(setEnv('OAUTH2_CLIENT_ID', undefined))
    const response = await client
      .get('/oauth2/authorize')
      .qs(authorizeQuery)
      .loginAs(user)
      .withInertia()

    response.assertInertiaPropsContains({ error: 'invalidClient' })
    response.assertStatus(400)
  })

  test('should show an error for an unknown redirect URI', async function ({ client }) {
    const { user } = await signIn({ did })
    const response = await client
      .get('/oauth2/authorize')
      .qs({ ...authorizeQuery, redirect_uri: 'https://b.com' })
      .loginAs(user)
      .withInertia()

    response.assertInertiaPropsContains({ error: 'invalidClient' })
    response.assertStatus(400)
  })

  test('should show an error to others', async function ({ client }) {
    const { user } = await signIn({ did: otherDid })
    const response = await client
      .get('/oauth2/authorize')
      .qs(authorizeQuery)
      .loginAs(user)
      .withInertia()

    response.assertInertiaPropsContains({ error: 'invalidClient' })
    response.assertStatus(400)
  })

  test('should redirect with `unsupported_response_type`', async function ({ client }) {
    const { user } = await signIn({ did })
    const response = await client
      .get('/oauth2/authorize')
      .qs({ ...authorizeQuery, response_type: 'token' })
      .loginAs(user)
      .redirects(0)

    response.assertHeader('location', redirectUri + '?error=unsupported_response_type&state=b')
  })
})

test.group('oauth2 / POST /oauth2/authorize', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })
  group.each.teardown(restorePds)

  test('should redirect with `access_denied` when denied', async function ({ client }) {
    const { user } = await signIn({ did })
    const response = await client
      .post('/oauth2/authorize')
      .form({ decision: 'deny' })
      .withSession({ oauth2_request: oauth2Request })
      .withCsrfToken()
      .loginAs(user)
      .withInertia()

    response.assertHeader('x-inertia-location', redirectUri + '?error=access_denied&state=b')
  })

  test('should redirect with a code when the scopes are granted', async function ({
    assert,
    client,
  }) {
    const { user } = await signIn({ did, scope: importGranted })
    const response = await client
      .post('/oauth2/authorize')
      .form({ decision: 'allow' })
      .withSession({ oauth2_request: oauth2Request })
      .withCsrfToken()
      .loginAs(user)
      .withInertia()
    const location = new URL(response.header('x-inertia-location') ?? '')
    const grant = await Oauth2Grant.firstOrFail()

    assert.equal(location.origin + location.pathname, redirectUri)
    assert.equal(location.searchParams.get('state'), 'b')
    assert.equal(grant.did, did)
  })

  test('should ask the PDS for import scopes, keeping granted ones', async function ({
    assert,
    client,
  }) {
    const { authorizeCalls, user } = await signIn({ did, scope: 'atproto d' })
    const response = await client
      .post('/oauth2/authorize')
      .form({ decision: 'allow' })
      .withSession({ oauth2_request: oauth2Request })
      .withCsrfToken()
      .loginAs(user)
      .withInertia()

    response.assertHeader(
      'x-inertia-location',
      new URL('/oauth/authorize', testEnv.OAUTH_SERVICE).href
    )
    response.assertSession('oauth2_intent', oauth2Request)
    assert.deepEqual(authorizeCalls, [
      { input: did, scope: serializeScopes(importScopes.union(new Set(['atproto', 'd']))) },
    ])
  })

  test('should show an error to others', async function ({ assert, client }) {
    const { user } = await signIn({ did: otherDid })
    const response = await client
      .post('/oauth2/authorize')
      .form({ decision: 'allow' })
      .withSession({ oauth2_request: oauth2Request })
      .withCsrfToken()
      .loginAs(user)
      .withInertia()

    response.assertInertiaPropsContains({ error: 'invalidClient' })
    assert.equal(await Oauth2Grant.query().first(), null)
  })

  test('should redirect to the dashboard without a request', async function ({ client }) {
    const { user } = await signIn({ did })
    const response = await client
      .post('/oauth2/authorize')
      .form({ decision: 'allow' })
      .withCsrfToken()
      .loginAs(user)
      .redirects(0)

    response.assertHeader('location', '/dashboard')
  })
})

test.group('oauth2 / GET /oauth/callback', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })
  group.each.teardown(restorePds)

  test('should redirect with a code when the PDS granted the scopes', async function ({
    assert,
    client,
  }) {
    const pds = await signIn({ did })
    pds.scope = importGranted
    const response = await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'd' })
      .withSession({ oauth2_intent: oauth2Request, oauth_state: 'd' })
      .loginAs(pds.user)
      .redirects(0)
    const location = new URL(response.header('location') ?? '')

    assert.equal(location.origin + location.pathname, redirectUri)
    assert.isString(location.searchParams.get('code'))
  })

  test('should redirect with `access_denied` without the scopes', async function ({ client }) {
    const { user } = await signIn({ did })
    const response = await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'd' })
      .withSession({ oauth2_intent: oauth2Request, oauth_state: 'd' })
      .loginAs(user)
      .redirects(0)

    response.assertHeader('location', redirectUri + '?error=access_denied&state=b')
  })

  test('should redirect with `access_denied` when denied', async function ({ client }) {
    const pds = await signIn({ did })
    pds.callbackError = new OAuthCallbackError(new URLSearchParams({ error: 'access_denied' }))
    const response = await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'd' })
      .withSession({ oauth2_intent: oauth2Request, oauth_state: 'd' })
      .loginAs(pds.user)
      .redirects(0)

    response.assertHeader('location', redirectUri + '?error=access_denied&state=b')
  })

  test('should not connect another account', async function ({ assert, client }) {
    const pds = await signIn({ did })
    pds.callbackDid = otherDid
    pds.scope = importGranted
    const response = await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'd' })
      .withSession({ oauth2_intent: oauth2Request, oauth_state: 'd' })
      .loginAs(pds.user)
      .redirects(0)

    response.assertHeader('location', '/dashboard')
    response.assertFlashMessage('errorMessage', { key: 'oauth2.otherAccount' })
    assert.equal(await Oauth2Grant.query().first(), null)
  })

  test('should redirect with `server_error` if the state does not match', async function ({
    client,
  }) {
    const { user } = await signIn({ did })
    const response = await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'd' })
      .withSession({ oauth2_intent: oauth2Request, oauth_state: 'e' })
      .loginAs(user)
      .redirects(0)

    response.assertHeader('location', redirectUri + '?error=server_error&state=b')
  })
})

test.group('oauth2 / POST /oauth2/token', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should limit failures with a wrong secret', async function ({ client }) {
    for (let index = 0; index < 10; index++) await request('b')
    // Even with the right secret.
    const response = await request(clientSecret)

    response.assertBody({ error: 'temporarily_unavailable' })
    response.assertHeader('retry-after', '600')
    response.assertStatus(429)

    function request(secret: string) {
      return client.post('/oauth2/token').form({
        client_id: clientId,
        client_secret: secret,
        code: 'a',
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      })
    }
  })

  test('should limit failures with unknown codes', async function ({ client }) {
    for (let index = 0; index < 10; index++) await request()
    const response = await request()

    response.assertStatus(429)

    function request() {
      return client.post('/oauth2/token').form({
        client_id: clientId,
        client_secret: clientSecret,
        code: 'a',
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      })
    }
  })

  test('should not limit successes', async function ({ assert, client }) {
    await Account.create({ did })
    const tokens = await connect()
    if ('error' in tokens) throw new Error('Expected tokens')
    const refreshToken = tokens.refresh_token
    const statuses: Array<number> = []
    for (let index = 0; index < 12; index++) {
      const response = await request()
      statuses.push(response.status())
    }

    assert.deepEqual(
      statuses,
      Array.from({ length: 12 }, () => 200)
    )

    function request() {
      return client.post('/oauth2/token').form({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      })
    }
  })

  test('should give tokens for a code', async function ({ client }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const response = await client.post('/oauth2/token').form({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    })

    response.assertBodyContains({ scope: 'a', token_type: 'Bearer' })
    response.assertHeader('cache-control', 'no-store')
    response.assertStatus(200)
  })

  test('should give tokens for a refresh token', async function ({ client }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const first = await client.post('/oauth2/token').form({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    })
    const response = await client.post('/oauth2/token').form({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: first.body().refresh_token,
    })

    response.assertBodyContains({ refresh_token: first.body().refresh_token })
    response.assertStatus(200)
  })

  test('should be `invalid_client` for a wrong secret', async function ({ client }) {
    const response = await client.post('/oauth2/token').form({
      client_id: clientId,
      client_secret: 'a',
      code: 'b',
      grant_type: 'authorization_code',
    })

    response.assertBody({ error: 'invalid_client' })
    response.assertStatus(401)
  })

  test('should be `invalid_grant` for an unknown code', async function ({ client }) {
    const response = await client.post('/oauth2/token').form({
      client_id: clientId,
      client_secret: clientSecret,
      code: 'a',
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    })

    response.assertBody({ error: 'invalid_grant' })
    response.assertStatus(400)
  })

  test('should be `invalid_request` without a code', async function ({ client }) {
    const response = await client
      .post('/oauth2/token')
      .form({ client_id: clientId, client_secret: clientSecret, grant_type: 'authorization_code' })

    response.assertBody({ error: 'invalid_request' })
    response.assertStatus(400)
  })

  test('should be `invalid_request` without a refresh token', async function ({ client }) {
    const response = await client
      .post('/oauth2/token')
      .form({ client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token' })

    response.assertBody({ error: 'invalid_request' })
    response.assertStatus(400)
  })

  test('should be `unsupported_grant_type` for other grants', async function ({ client }) {
    const response = await client
      .post('/oauth2/token')
      .form({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' })

    response.assertBody({ error: 'unsupported_grant_type' })
    response.assertStatus(400)
  })
})

test.group('oauth2 / POST /oauth2/revoke', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should revoke', async function ({ assert, client }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const tokens = await client.post('/oauth2/token').form({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    })
    const response = await client
      .post('/oauth2/revoke')
      .bearerToken(tokens.body().access_token)
      .json({})
    const result = await oauth2Service.verifyAccessToken(tokens.body().access_token)

    response.assertStatus(200)
    assert.deepEqual(result, { error: 'session_invalidated' })
  })

  test('should be fine with unknown tokens', async function ({ client }) {
    const response = await client.post('/oauth2/revoke').bearerToken('a').json({})

    response.assertStatus(200)
  })

  test('should be `invalid_token` without a token', async function ({ client }) {
    const response = await client.post('/oauth2/revoke').json({})

    response.assertBody({ error: 'invalid_token' })
    response.assertStatus(401)
  })
})

test.group('oauth2 / connections', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })
  group.each.teardown(restorePds)

  test('should list connections', async function ({ client }) {
    const { user } = await signIn({ did })
    await connect()
    const response = await client.get('/connections').loginAs(user).withInertia()

    response.assertInertiaComponent('connections/show')
    response.assertInertiaPropsContains({ connections: [{ clientId, name: clientName }] })
  })

  test('should link to the client to connect', async function ({ client }) {
    const { user } = await signIn({ did })
    const response = await client.get('/connections').loginAs(user).withInertia()

    response.assertInertiaPropsContains({
      connect: { name: clientName, url: testEnv.OAUTH2_CLIENT_CONNECT_URL },
      showConnections: true,
    })
  })

  test('should not link to the client when connected', async function ({ assert, client }) {
    const { user } = await signIn({ did })
    await connect()
    const response = await client.get('/connections').loginAs(user).withInertia()

    assert.notProperty(response.body().props, 'connect')
  })

  test('should not link to the client without a connect URL', async function ({
    assert,
    cleanup,
    client,
  }) {
    const { user } = await signIn({ did })
    cleanup(setEnv('OAUTH2_CLIENT_CONNECT_URL', undefined))
    const response = await client.get('/connections').loginAs(user).withInertia()

    assert.notProperty(response.body().props, 'connect')
  })

  test('should not link in the sidebar without connections or a connect URL', async function ({
    cleanup,
    client,
  }) {
    const { user } = await signIn({ did })
    cleanup(setEnv('OAUTH2_CLIENT_CONNECT_URL', undefined))
    const response = await client.get('/faq').loginAs(user).withInertia()

    response.assertInertiaPropsContains({ showConnections: false })
  })

  test('should link in the sidebar when connected, without a connect URL', async function ({
    cleanup,
    client,
  }) {
    const { user } = await signIn({ did })
    await connect()
    cleanup(setEnv('OAUTH2_CLIENT_CONNECT_URL', undefined))
    const response = await client.get('/faq').loginAs(user).withInertia()

    response.assertInertiaPropsContains({ showConnections: true })
  })

  test('should not link in the sidebar for others', async function ({ client }) {
    const { user } = await signIn({ did: otherDid })
    const response = await client.get('/faq').loginAs(user).withInertia()

    response.assertInertiaPropsContains({ showConnections: false })
  })

  test('should not show the page to others', async function ({ client }) {
    const { user } = await signIn({ did: otherDid })
    const response = await client.get('/connections').loginAs(user)

    response.assertStatus(404)
  })

  test('should disconnect', async function ({ assert, client }) {
    const { user } = await signIn({ did })
    await connect()
    const response = await client
      .delete('/connections/' + clientId)
      .withCsrfToken()
      .loginAs(user)
      .redirects(0)

    response.assertHeader('location', '/connections')
    assert.deepEqual(await oauth2Service.listConnections(did), [])
  })

  test('should not disconnect for others', async function ({ client }) {
    const { user } = await signIn({ did: otherDid })
    const response = await client
      .delete('/connections/' + clientId)
      .withCsrfToken()
      .loginAs(user)

    response.assertStatus(404)
  })
})

test.group('oauth2 / logging in and out', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })
  group.each.teardown(restorePds)

  test('should ask for import scopes after logging in, when connected', async function ({
    assert,
    cleanup,
    client,
  }) {
    const pds = await signIn({ did })
    await connect()
    await prepareLogin(cleanup)
    const response = await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'd' })
      .withSession({ oauth_state: 'd', source: 'login' })
      .redirects(0)

    response.assertHeader('location', new URL('/oauth/authorize', testEnv.OAUTH_SERVICE).href)
    response.assertSession('import_scopes_intent', true)
    assert.deepEqual(pds.authorizeCalls, [{ input: did, scope: importGranted }])
  })

  test('should not ask for import scopes when granted', async function ({ cleanup, client }) {
    await signIn({ did, scope: importGranted })
    await connect()
    await prepareLogin(cleanup)
    const response = await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'd' })
      .withSession({ oauth_state: 'd', source: 'login' })
      .redirects(0)

    response.assertHeader('location', '/dashboard')
  })

  test('should log in if asking for import scopes fails', async function ({ cleanup, client }) {
    const pds = await signIn({ did })
    await connect()
    await prepareLogin(cleanup)
    pds.authorizeError = new Error('a')
    const response = await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'd' })
      .withSession({ oauth_state: 'd', source: 'login' })
      .redirects(0)

    response.assertHeader('location', '/dashboard')
    response.assertFlashMessage('errorMessage', { key: 'oauth2.importScopesMissing' })
    response.assertSessionMissing('import_scopes_intent')
  })

  test('should finish asking for import scopes', async function ({ client }) {
    const pds = await signIn({ did })
    pds.scope = importGranted
    const response = await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'd' })
      .withSession({ import_scopes_intent: true, oauth_state: 'd' })
      .loginAs(pds.user)
      .redirects(0)

    response.assertHeader('location', '/dashboard')
    response.assertFlashMissing('errorMessage')
  })

  test('should say when import scopes are not granted', async function ({ client }) {
    const { user } = await signIn({ did })
    const response = await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'd' })
      .withSession({ import_scopes_intent: true, oauth_state: 'd' })
      .loginAs(user)
      .redirects(0)

    response.assertFlashMessage('errorMessage', { key: 'oauth2.importScopesMissing' })
  })

  test('should say when import scopes are denied', async function ({ client }) {
    const pds = await signIn({ did })
    pds.callbackError = new OAuthCallbackError(new URLSearchParams({ error: 'access_denied' }))
    const response = await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'd' })
      .withSession({ import_scopes_intent: true, oauth_state: 'd' })
      .loginAs(pds.user)
      .redirects(0)

    response.assertFlashMessage('errorMessage', { key: 'oauth2.importScopesMissing' })
  })

  test('should say when asking for import scopes fails', async function ({ client }) {
    const { user } = await signIn({ did })
    const response = await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'd' })
      .withSession({ import_scopes_intent: true, oauth_state: 'e' })
      .loginAs(user)
      .redirects(0)

    response.assertFlashMessage('errorMessage', { key: 'oauth2.importScopesMissing' })
  })

  test('should keep imports working after logging out and in again', async function ({
    assert,
    cleanup,
    client,
  }) {
    const pds = await signIn({ did, scope: importGranted })
    const tokens = await connect()
    if ('error' in tokens) throw new Error('Expected tokens')

    // Log out: keeps the session on the PDS.
    await client.post('/oauth/logout').withCsrfToken().loginAs(pds.user).redirects(0)

    // Log in again: the PDS gives a session with the login scopes only.
    pds.scope = 'atproto'
    await prepareLogin(cleanup)
    const login = await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'd' })
      .withSession({ oauth_state: 'd', source: 'login' })
      .redirects(0)

    // Ask for the import scopes again, which are granted.
    pds.scope = importGranted
    await client
      .get('/oauth/callback')
      .qs({ code: 'c', state: 'e' })
      .withSession({ import_scopes_intent: true, oauth_state: 'e' })
      .loginAs(pds.user)
      .redirects(0)
    const grant = await oauth2Service.verifyAccessToken(tokens.access_token)
    const { scope } = await pds.user.getTokenInfo()

    login.assertSession('import_scopes_intent', true)
    assert.deepEqual(pds.revokeCalls, [])
    assert.equal('error' in grant ? grant.error : grant.did, did)
    assert.isTrue(parseScopes(scope).isSupersetOf(importScopes))
  })

  test('should keep the session on the PDS for connected services', async function ({
    assert,
    client,
  }) {
    const { revokeCalls, user } = await signIn({ did })
    await connect()
    await client.post('/oauth/logout').withCsrfToken().loginAs(user).redirects(0)

    assert.deepEqual(revokeCalls, [])
  })

  test('should drop a stale connect flow when logging in', async function ({ client }) {
    await signIn({ did })
    const response = await client
      .post('/oauth/login')
      .form({ input: handle })
      .withSession({ oauth2_intent: oauth2Request })
      .withCsrfToken()
      .withInertia()
      .redirects(0)

    response.assertSessionMissing('oauth2_intent')
  })

  test('should drop a stale connect flow when signing up', async function ({ client }) {
    await signIn({ did })
    const response = await client
      .post('/oauth/signup')
      .form({ terms: 'true' })
      .withSession({ oauth2_intent: oauth2Request })
      .withCsrfToken()
      .withInertia()
      .redirects(0)

    response.assertSessionMissing('oauth2_intent')
  })
})

/**
 * Connect, as if the person agreed and the client exchanged the code.
 */
async function connect() {
  const code = await oauth2Service.issueCode({ clientId, did, redirectUri, scope: 'a' })
  const client = oauth2Service.getClient()
  if (!client) throw new Error('Expected a client')
  return oauth2Service.exchangeCode({ client, code, redirectUri })
}

/**
 * Prepare logging in: mark the account as synced, so that no backfill is
 * queued, and do not watch it, as that connects to Jetstream.
 */
async function prepareLogin(cleanup: (handler: () => void) => void) {
  const account = await Account.findOrFail(did)
  await account.merge({ lastActivitySyncAt: DateTime.now() }).save()
  jetstreamService.addDid = function () {}
  cleanup(function () {
    Reflect.deleteProperty(jetstreamService, 'addDid')
  })
}
