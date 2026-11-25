import testUtils from '@adonisjs/core/services/test_utils'
import type { DidString } from '@atproto/lex'
import type { ApiClient, ApiResponse } from '@japa/api-client'
import { test } from '@japa/runner'
import type { AtprotoUser } from '@thisismissem/adonisjs-atproto-oauth'
import Account from '#models/account'
import Oauth2Grant from '#models/oauth2_grant'
import oauth2Service from '#services/oauth2_service'
import { favoriteScope, importScopes, parseScopes, serializeScopes } from '#utils/oauth'
import { testEnv } from '../env.ts'
import { createAccount, oauthClient } from '../pds.ts'
import { answerOnPds, logIn, prepareLogIn, setEnv, signIn, startLogIn } from './helpers.ts'

// See `tests/env.ts`.
const clientId = testEnv.OAUTH2_CLIENT_ID
const clientName = testEnv.OAUTH2_CLIENT_NAME
const clientSecret = testEnv.OAUTH2_CLIENT_SECRET
// DID of accounts only in the database, not on the PDS of the tests (see
// `signIn` for those).
const localDid = 'did:web:a.com'
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
// Only allowed DID in tests that check others are not allowed.
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

  test('should render the consent page', async function ({ client }) {
    const { handle, user } = await signIn()
    const response = await client
      .get('/oauth2/authorize')
      .qs(authorizeQuery)
      .loginAs(user)
      .withInertia()

    response.assertInertiaComponent('oauth2/authorize')
    response.assertInertiaPropsContains({ clientName, handle: handle })
    response.assertStatus(200)
  })

  test('should keep the request in the session', async function ({ client }) {
    const { user } = await signIn()
    const response = await client
      .get('/oauth2/authorize')
      .qs(authorizeQuery)
      .loginAs(user)
      .withInertia()

    response.assertSession('oauth2_request', oauth2Request)
  })

  test('should show the DID without a handle', async function ({ client }) {
    const { did, user } = await signIn({ handle: null })
    const response = await client
      .get('/oauth2/authorize')
      .qs(authorizeQuery)
      .loginAs(user)
      .withInertia()

    response.assertInertiaPropsContains({ handle: did })
  })

  test('should sort scopes', async function ({ client }) {
    const { user } = await signIn()
    const response = await client
      .get('/oauth2/authorize')
      .qs({ ...authorizeQuery, scope: 'c a' })
      .loginAs(user)
      .withInertia()

    response.assertSession('oauth2_request', { ...oauth2Request, scope: 'a c' })
  })

  test('should support no scopes', async function ({ client }) {
    const { user } = await signIn()
    const response = await client
      .get('/oauth2/authorize')
      .qs({ ...authorizeQuery, scope: undefined })
      .loginAs(user)
      .withInertia()

    response.assertSession('oauth2_request', { ...oauth2Request, scope: '' })
  })

  test('should show an error for an unknown client', async function ({ client }) {
    const { user } = await signIn()
    const response = await client
      .get('/oauth2/authorize')
      .qs({ ...authorizeQuery, client_id: 'other' })
      .loginAs(user)
      .withInertia()

    response.assertInertiaPropsContains({ error: 'invalidClient' })
    response.assertStatus(400)
  })

  test('should show an error without a client', async function ({ cleanup, client }) {
    const { user } = await signIn()
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
    const { user } = await signIn()
    const response = await client
      .get('/oauth2/authorize')
      .qs({ ...authorizeQuery, redirect_uri: 'https://b.com' })
      .loginAs(user)
      .withInertia()

    response.assertInertiaPropsContains({ error: 'invalidClient' })
    response.assertStatus(400)
  })

  test('should show an error to others', async function ({ cleanup, client }) {
    cleanup(setEnv('OAUTH2_ALLOWED_DIDS', [otherDid]))
    const { user } = await signIn()
    const response = await client
      .get('/oauth2/authorize')
      .qs(authorizeQuery)
      .loginAs(user)
      .withInertia()

    response.assertInertiaPropsContains({ error: 'invalidClient' })
    response.assertStatus(400)
  })

  test('should redirect with `unsupported_response_type`', async function ({ client }) {
    const { user } = await signIn()
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

  test('should redirect with `access_denied` when denied', async function ({ client }) {
    const { user } = await signIn()
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
    const { did, user } = await signIn({ scope: importGranted })
    const response = await allow(client, user)
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
    const granted = serializeScopes(new Set(['atproto', favoriteScope]))
    const { did, user } = await signIn({ scope: granted })
    const response = await allow(client, user)
    await answerOnPds(client, response, did, { user })
    const scopes = await grantedScopes(did)

    response.assertSession('oauth2_intent', oauth2Request)
    assert.isTrue(scopes.isSupersetOf(parseScopes(granted).union(importScopes)))
  })

  test('should show an error to others', async function ({ assert, cleanup, client }) {
    cleanup(setEnv('OAUTH2_ALLOWED_DIDS', [otherDid]))
    const { user } = await signIn()
    const response = await allow(client, user)

    response.assertInertiaPropsContains({ error: 'invalidClient' })
    assert.equal(await Oauth2Grant.query().first(), null)
  })

  test('should redirect to the dashboard without a request', async function ({ client }) {
    const { user } = await signIn()
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

  test('should redirect with a code when the PDS granted the scopes', async function ({
    assert,
    client,
  }) {
    const { did, user } = await signIn()
    const response = await answerOnPds(client, await allow(client, user), did, { user })
    const location = new URL(response.header('location') ?? '')

    assert.equal(location.origin + location.pathname, redirectUri)
    assert.isString(location.searchParams.get('code'))
  })

  test('should redirect with `access_denied` without the scopes', async function ({ client }) {
    const { did, user } = await signIn()
    const response = await answerOnPds(client, await allow(client, user), did, {
      scope: 'atproto',
      user,
    })

    response.assertHeader('location', redirectUri + '?error=access_denied&state=b')
  })

  test('should redirect with `access_denied` when denied', async function ({ client }) {
    const { did, user } = await signIn()
    const response = await answerOnPds(client, await allow(client, user), did, {
      deny: true,
      user,
    })

    response.assertHeader('location', redirectUri + '?error=access_denied&state=b')
  })

  test('should not connect another account', async function ({ assert, client }) {
    const { did, user } = await signIn()
    const other = await createAccount()
    const response = await answerOnPds(client, await allow(client, user), did, {
      as: other.did,
      user,
    })

    response.assertHeader('location', '/dashboard')
    response.assertFlashMessage('errorMessage', { key: 'oauth2.otherAccount' })
    assert.equal(await Oauth2Grant.query().first(), null)
  })

  test('should redirect with `server_error` if the state does not match', async function ({
    client,
  }) {
    const { did, user } = await signIn()
    const response = await answerOnPds(client, await allow(client, user), did, {
      session: { oauth_state: 'e' },
      user,
    })

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
    await Account.create({ did: localDid })
    const tokens = await connect(localDid)
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
    await Account.create({ did: localDid })
    const code = await oauth2Service.issueCode({
      clientId,
      did: localDid,
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
    await Account.create({ did: localDid })
    const code = await oauth2Service.issueCode({
      clientId,
      did: localDid,
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
    await Account.create({ did: localDid })
    const code = await oauth2Service.issueCode({
      clientId,
      did: localDid,
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

  test('should list connections', async function ({ client }) {
    const { did, user } = await signIn()
    await connect(did)
    const response = await client.get('/connections').loginAs(user).withInertia()

    response.assertInertiaComponent('connections/show')
    response.assertInertiaPropsContains({ connections: [{ clientId, name: clientName }] })
  })

  test('should link to the client to connect', async function ({ client }) {
    const { user } = await signIn()
    const response = await client.get('/connections').loginAs(user).withInertia()

    response.assertInertiaPropsContains({
      connect: { name: clientName, url: testEnv.OAUTH2_CLIENT_CONNECT_URL },
      showConnections: true,
    })
  })

  test('should not link to the client when connected', async function ({ assert, client }) {
    const { did, user } = await signIn()
    await connect(did)
    const response = await client.get('/connections').loginAs(user).withInertia()

    assert.notProperty(response.body().props, 'connect')
  })

  test('should not link to the client without a connect URL', async function ({
    assert,
    cleanup,
    client,
  }) {
    const { user } = await signIn()
    cleanup(setEnv('OAUTH2_CLIENT_CONNECT_URL', undefined))
    const response = await client.get('/connections').loginAs(user).withInertia()

    assert.notProperty(response.body().props, 'connect')
  })

  test('should not link in the sidebar without connections or a connect URL', async function ({
    cleanup,
    client,
  }) {
    const { user } = await signIn()
    cleanup(setEnv('OAUTH2_CLIENT_CONNECT_URL', undefined))
    const response = await client.get('/faq').loginAs(user).withInertia()

    response.assertInertiaPropsContains({ showConnections: false })
  })

  test('should link in the sidebar when connected, without a connect URL', async function ({
    cleanup,
    client,
  }) {
    const { did, user } = await signIn()
    await connect(did)
    cleanup(setEnv('OAUTH2_CLIENT_CONNECT_URL', undefined))
    const response = await client.get('/faq').loginAs(user).withInertia()

    response.assertInertiaPropsContains({ showConnections: true })
  })

  test('should not link in the sidebar for others', async function ({ cleanup, client }) {
    cleanup(setEnv('OAUTH2_ALLOWED_DIDS', [otherDid]))
    const { user } = await signIn()
    const response = await client.get('/faq').loginAs(user).withInertia()

    response.assertInertiaPropsContains({ showConnections: false })
  })

  test('should not show the page to others', async function ({ cleanup, client }) {
    cleanup(setEnv('OAUTH2_ALLOWED_DIDS', [otherDid]))
    const { user } = await signIn()
    const response = await client.get('/connections').loginAs(user)

    response.assertStatus(404)
  })

  test('should disconnect', async function ({ assert, client }) {
    const { did, user } = await signIn()
    await connect(did)
    const response = await client
      .delete('/connections/' + clientId)
      .withCsrfToken()
      .loginAs(user)
      .redirects(0)

    response.assertHeader('location', '/connections')
    assert.deepEqual(await oauth2Service.listConnections(did), [])
  })

  test('should not disconnect for others', async function ({ cleanup, client }) {
    cleanup(setEnv('OAUTH2_ALLOWED_DIDS', [otherDid]))
    const { user } = await signIn()
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

  test('should ask for import scopes after logging in, when connected', async function ({
    assert,
    cleanup,
    client,
  }) {
    const { did, login } = await logInConnected(client, cleanup)
    const response = await answerOnPds(client, login, did)
    const scopes = await grantedScopes(did)

    login.assertSession('import_scopes_intent', true)
    response.assertHeader('location', '/dashboard')
    response.assertFlashMissing('errorMessage')
    assert.isTrue(scopes.isSupersetOf(importScopes))
  })

  test('should log in if asking for import scopes fails', async function ({ cleanup, client }) {
    const { did } = await signIn()
    await connect(did)
    await prepareLogIn(did, cleanup)
    const started = await startLogIn(client, did)
    // No real way for only this to fail.
    const oauth = oauthClient()
    oauth.authorize = async function () {
      throw new Error('a')
    }
    cleanup(function () {
      Reflect.deleteProperty(oauth, 'authorize')
    })
    const response = await answerOnPds(client, started, did)

    response.assertHeader('location', '/dashboard')
    response.assertFlashMessage('errorMessage', { key: 'oauth2.importScopesMissing' })
    response.assertSessionMissing('import_scopes_intent')
  })

  test('should say when import scopes are not granted', async function ({ cleanup, client }) {
    const { did, login } = await logInConnected(client, cleanup)
    const response = await answerOnPds(client, login, did, { scope: 'atproto' })

    response.assertFlashMessage('errorMessage', { key: 'oauth2.importScopesMissing' })
  })

  test('should say when import scopes are denied', async function ({ cleanup, client }) {
    const { did, login } = await logInConnected(client, cleanup)
    const response = await answerOnPds(client, login, did, { deny: true })

    response.assertFlashMessage('errorMessage', { key: 'oauth2.importScopesMissing' })
  })

  test('should say when asking for import scopes fails', async function ({ cleanup, client }) {
    const { did, login } = await logInConnected(client, cleanup)
    const response = await answerOnPds(client, login, did, { session: { oauth_state: 'e' } })

    response.assertFlashMessage('errorMessage', { key: 'oauth2.importScopesMissing' })
  })

  test('should keep imports working after logging out and in again', async function ({
    assert,
    cleanup,
    client,
  }) {
    const { did, user } = await signIn({ scope: importGranted })
    const tokens = await connect(did)
    if ('error' in tokens) throw new Error('Expected tokens')
    await prepareLogIn(did, cleanup)
    await client.post('/oauth/logout').withCsrfToken().loginAs(user).redirects(0)
    // Logging in only asks for the login scopes, so the app asks for the
    // import scopes again.
    const login = await logIn(client, did)
    await answerOnPds(client, login, did)
    const grant = await oauth2Service.verifyAccessToken(tokens.access_token)
    const scopes = await grantedScopes(did)

    login.assertSession('import_scopes_intent', true)
    assert.equal('error' in grant ? grant.error : grant.did, did)
    assert.isTrue(scopes.isSupersetOf(importScopes))
  })

  test('should keep the session on the PDS for connected services', async function ({
    assert,
    client,
  }) {
    const { did, user } = await signIn()
    await connect(did)
    await client.post('/oauth/logout').withCsrfToken().loginAs(user).redirects(0)

    await assert.doesNotReject(function () {
      return oauthClient().restore(did)
    })
  })

  test('should drop a stale connect flow when logging in', async function ({ client }) {
    const { handle } = await signIn()
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
    await signIn()
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
async function connect(did: DidString) {
  const code = await oauth2Service.issueCode({ clientId, did, redirectUri, scope: 'a' })
  const client = oauth2Service.getClient()
  if (!client) throw new Error('Expected a client')
  return oauth2Service.exchangeCode({ client, code, redirectUri })
}

/**
 * Allow the client on the consent page.
 */
function allow(client: ApiClient, user: AtprotoUser): Promise<ApiResponse> {
  return client
    .post('/oauth2/authorize')
    .form({ decision: 'allow' })
    .withSession({ oauth2_request: oauth2Request })
    .withCsrfToken()
    .loginAs(user)
    .withInertia()
}

/**
 * Get the scopes granted to the session on the PDS.
 */
async function grantedScopes(did: DidString): Promise<Set<string>> {
  const session = await oauthClient().restore(did)
  const { scope } = await session.getTokenInfo()
  return parseScopes(scope)
}

/**
 * Log in with a connected service, which makes the app ask for the import
 * scopes.
 */
async function logInConnected(
  client: ApiClient,
  cleanup: (handler: () => void) => void
): Promise<{ did: DidString; login: ApiResponse }> {
  const { did } = await signIn()
  await connect(did)
  await prepareLogIn(did, cleanup)
  return { did, login: await logIn(client, did) }
}
