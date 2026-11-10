import assert from 'node:assert/strict'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Account from '#models/account'
import Oauth2Grant from '#models/oauth2_grant'
import oauth2Service, { hashToken } from '#services/oauth2_service'
import { testEnv } from '../../env.ts'
import { setEnv } from '../helpers.ts'

// See `tests/env.ts`.
const clientId = testEnv.OAUTH2_CLIENT_ID
const clientName = testEnv.OAUTH2_CLIENT_NAME
const clientSecret = testEnv.OAUTH2_CLIENT_SECRET
const did = testEnv.OAUTH2_ALLOWED_DIDS
const redirectUri = testEnv.OAUTH2_CLIENT_REDIRECT_URIS

const client = oauth2Service.getClient()!

const otherDid = 'did:web:b.com'
assert.notEqual(did, otherDid)

test.group('services / oauth2 / authenticateClient', function () {
  test('should support the configured client', function ({ assert }) {
    const result = oauth2Service.authenticateClient(clientId, clientSecret)
    assert.equal(result?.id, clientId)
  })

  test('should not support a wrong secret', function ({ assert }) {
    const result = oauth2Service.authenticateClient(clientId, 'a')
    assert.equal(result, undefined)
  })

  test('should not support another client', function ({ assert }) {
    const result = oauth2Service.authenticateClient('a', clientSecret)
    assert.equal(result, undefined)
  })

  test('should not support a missing client', function ({ assert }) {
    const result = oauth2Service.authenticateClient(undefined, clientSecret)
    assert.equal(result, undefined)
  })

  test('should not support a missing secret', function ({ assert }) {
    const result = oauth2Service.authenticateClient(clientId, undefined)
    assert.equal(result, undefined)
  })
})

test.group('services / oauth2 / exchangeCode', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should give tokens', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const result = await oauth2Service.exchangeCode({ client, code, redirectUri })

    assert.containSubset(result, { expires_in: 3600, scope: 'a', token_type: 'Bearer' })
  })

  test('should not store tokens', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const result = await oauth2Service.exchangeCode({ client, code, redirectUri })
    if ('error' in result) throw new Error('Unexpected error: ' + result.error)
    const grant = await Oauth2Grant.firstOrFail()

    assert.notEqual(grant.accessTokenHash, result.access_token)
    assert.equal(grant.accessTokenHash, hashToken(result.access_token))
  })

  test('should work once', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    await oauth2Service.exchangeCode({ client, code, redirectUri })
    const result = await oauth2Service.exchangeCode({ client, code, redirectUri })

    assert.deepEqual(result, { error: 'invalid_grant' })
  })

  test('should work once at the same time', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const results = await Promise.all([
      oauth2Service.exchangeCode({ client, code, redirectUri }),
      oauth2Service.exchangeCode({ client, code, redirectUri }),
    ])

    assert.deepEqual(
      results.map(function (d) {
        return 'error' in d ? d.error : 'ok'
      }),
      ['ok', 'invalid_grant']
    )
  })

  test('should not work with another redirect URI', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const result = await oauth2Service.exchangeCode({ client, code, redirectUri: 'https://b.com' })

    assert.deepEqual(result, { error: 'invalid_grant' })
  })

  test('should not work after a failed try', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    await oauth2Service.exchangeCode({ client, code, redirectUri: 'https://b.com' })
    const result = await oauth2Service.exchangeCode({ client, code, redirectUri })

    assert.deepEqual(result, { error: 'invalid_grant' })
  })

  test('should not work when expired', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    await Oauth2Grant.query().update({
      code_expires_at: DateTime.now().minus({ minutes: 1 }).toSQL(),
    })
    const result = await oauth2Service.exchangeCode({ client, code, redirectUri })

    assert.deepEqual(result, { error: 'invalid_grant' })
  })

  test('should not work with unknown codes', async function ({ assert }) {
    const result = await oauth2Service.exchangeCode({ client, code: 'a', redirectUri })

    assert.deepEqual(result, { error: 'invalid_grant' })
  })
})

test.group('services / oauth2 / hasConnections', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should work', async function ({ assert }) {
    await Account.create({ did })

    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const tokens = await oauth2Service.exchangeCode({ client, code, redirectUri })
    assert.equal('error' in tokens, false)

    const result = await oauth2Service.hasConnections(did)

    assert.equal(result, true)
  })
})

test.group('services / oauth2 / isAllowed', function () {
  test('should allow DIDs in `OAUTH2_ALLOWED_DIDS`', function ({ assert }) {
    const result = oauth2Service.isAllowed(did)
    assert.equal(result, true)
  })

  test('should not allow other DIDs', function ({ assert }) {
    const result = oauth2Service.isAllowed(otherDid)
    assert.equal(result, false)
  })
})

test.group('services / oauth2 / listConnections', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should list a client once', async function ({ assert }) {
    await Account.create({ did })
    let code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    let tokens = await oauth2Service.exchangeCode({ client, code, redirectUri })
    assert.equal('error' in tokens, false)

    code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    tokens = await oauth2Service.exchangeCode({ client, code, redirectUri })
    assert.equal('error' in tokens, false)

    const result = await oauth2Service.listConnections(did)

    assert.deepEqual(
      result.map(function (d) {
        return d.name
      }),
      [clientName]
    )
  })

  test('should name clients that are no longer configured by ID', async function ({ assert }) {
    await Account.create({ did })
    await Oauth2Grant.create({
      clientId: 'other',
      did,
      redirectUri,
      refreshTokenHash: hashToken('a'),
      scope: 'a',
    })
    const result = await oauth2Service.listConnections(did)

    assert.deepEqual(
      result.map(function (d) {
        return d.name
      }),
      ['other']
    )
  })

  test('should not list codes that were not exchanged', async function ({ assert }) {
    await Account.create({ did })
    await oauth2Service.issueCode({ clientId, did, redirectUri, scope: 'a' })
    const result = await oauth2Service.listConnections(did)
    assert.deepEqual(result, [])
  })

  test('should not list disconnected clients', async function ({ assert }) {
    await Account.create({ did })

    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const tokens = await oauth2Service.exchangeCode({ client, code, redirectUri })
    assert.equal('error' in tokens, false)

    await oauth2Service.disconnect(did, client.id)
    const result = await oauth2Service.listConnections(did)

    assert.deepEqual(result, [])
  })
})

test.group('services / oauth2 / refresh', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should give a new access token', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const tokens = await oauth2Service.exchangeCode({ client, code, redirectUri })
    if ('error' in tokens) throw new Error('Unexpected error: ' + tokens.error)
    const result = await oauth2Service.refresh({ client, refreshToken: tokens.refresh_token })
    if ('error' in result) throw new Error('Unexpected error: ' + result.error)

    assert.notEqual(result.access_token, tokens.access_token)
  })

  test('should not work with unknown tokens', async function ({ assert }) {
    const result = await oauth2Service.refresh({ client, refreshToken: 'a' })
    assert.deepEqual(result, { error: 'invalid_grant' })
  })

  test('should keep the refresh token', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const tokens = await oauth2Service.exchangeCode({ client, code, redirectUri })
    if ('error' in tokens) throw new Error('Unexpected error: ' + tokens.error)
    const result = await oauth2Service.refresh({ client, refreshToken: tokens.refresh_token })
    if ('error' in result) throw new Error('Unexpected error: ' + result.error)

    assert.equal(result.refresh_token, tokens.refresh_token)
  })

  test('should invalidate the old access token', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const tokens = await oauth2Service.exchangeCode({ client, code, redirectUri })
    if ('error' in tokens) throw new Error('Unexpected error: ' + tokens.error)
    const refreshResult = await oauth2Service.refresh({
      client,
      refreshToken: tokens.refresh_token,
    })
    assert.equal('error' in refreshResult, false)
    const result = await oauth2Service.verifyAccessToken(tokens.access_token)

    assert.deepEqual(result, { error: 'invalid_token' })
  })

  test('should not work after disconnecting', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const tokens = await oauth2Service.exchangeCode({ client, code, redirectUri })
    if ('error' in tokens) throw new Error('Unexpected error: ' + tokens.error)
    await oauth2Service.disconnect(did, client.id)
    const result = await oauth2Service.refresh({ client, refreshToken: tokens.refresh_token })

    assert.deepEqual(result, { error: 'invalid_grant' })
  })
})

test.group('services / oauth2 / verifyAccessToken', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should give the grant', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const tokens = await oauth2Service.exchangeCode({ client, code, redirectUri })
    if ('error' in tokens) throw new Error('Unexpected error: ' + tokens.error)
    const result = await oauth2Service.verifyAccessToken(tokens.access_token)
    if ('error' in result) throw new Error('Unexpected error: ' + result.error)

    assert.equal(result.did, did)
  })

  test('should be `invalid_token` when expired', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const tokens = await oauth2Service.exchangeCode({ client, code, redirectUri })
    if ('error' in tokens) throw new Error('Unexpected error: ' + tokens.error)
    await Oauth2Grant.query().update({
      access_token_expires_at: DateTime.now().minus({ minutes: 1 }).toSQL(),
    })
    const result = await oauth2Service.verifyAccessToken(tokens.access_token)

    assert.deepEqual(result, { error: 'invalid_token' })
  })

  test('should be `session_invalidated` after disconnecting', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const tokens = await oauth2Service.exchangeCode({ client, code, redirectUri })
    if ('error' in tokens) throw new Error('Unexpected error: ' + tokens.error)
    await oauth2Service.disconnect(did, client.id)
    const result = await oauth2Service.verifyAccessToken(tokens.access_token)

    assert.deepEqual(result, { error: 'session_invalidated' })
  })

  test('should be `session_invalidated` after revoking', async function ({ assert }) {
    await Account.create({ did })
    const code = await oauth2Service.issueCode({
      clientId,
      did,
      redirectUri,
      scope: 'a',
    })
    const tokens = await oauth2Service.exchangeCode({ client, code, redirectUri })
    if ('error' in tokens) throw new Error('Unexpected error: ' + tokens.error)
    await oauth2Service.revoke(tokens.access_token)
    const result = await oauth2Service.verifyAccessToken(tokens.access_token)

    assert.deepEqual(result, { error: 'session_invalidated' })
  })

  test('should be `invalid_token` for unknown tokens', async function ({ assert }) {
    const result = await oauth2Service.verifyAccessToken('a')
    assert.deepEqual(result, { error: 'invalid_token' })
  })
})

test.group('services / oauth2 / not allowed', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should not exchange codes', async function ({ assert }) {
    await Account.create({ did: otherDid })
    const code = await oauth2Service.issueCode({
      clientId,
      did: otherDid,
      redirectUri,
      scope: 'a',
    })
    const result = await oauth2Service.exchangeCode({ client, code, redirectUri })

    assert.deepEqual(result, { error: 'invalid_grant' })
  })

  test('should not refresh', async function ({ assert }) {
    await Account.create({ did: otherDid })
    await Oauth2Grant.create({
      clientId,
      did: otherDid,
      redirectUri,
      refreshTokenHash: hashToken('a'),
      scope: 'a',
    })
    const result = await oauth2Service.refresh({ client, refreshToken: 'a' })

    assert.deepEqual(result, { error: 'invalid_grant' })
  })

  test('should not accept access tokens', async function ({ assert }) {
    await Account.create({ did: otherDid })
    await Oauth2Grant.create({
      accessTokenExpiresAt: DateTime.now().plus({ hours: 1 }),
      accessTokenHash: hashToken('a'),
      clientId,
      did: otherDid,
      redirectUri,
      scope: 'a',
    })
    const result = await oauth2Service.verifyAccessToken('a')

    assert.deepEqual(result, { error: 'invalid_token' })
  })
})

test.group('services / oauth2 / environment', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should have no client without `OAUTH2_CLIENT_ID`', function ({ assert, cleanup }) {
    cleanup(setEnv('OAUTH2_CLIENT_ID', undefined))
    const result = oauth2Service.getClient()

    assert.isUndefined(result)
  })

  test('should not authenticate without a client', function ({ assert, cleanup }) {
    cleanup(setEnv('OAUTH2_CLIENT_ID', undefined))
    const result = oauth2Service.authenticateClient(clientId, clientSecret)

    assert.isUndefined(result)
  })

  test('should name the client by ID without `OAUTH2_CLIENT_NAME`', function ({ assert, cleanup }) {
    cleanup(setEnv('OAUTH2_CLIENT_NAME', undefined))
    const result = oauth2Service.getClient()?.name

    assert.equal(result, clientId)
  })

  test('should allow everyone without `OAUTH2_ALLOWED_DIDS`', function ({ assert, cleanup }) {
    cleanup(setEnv('OAUTH2_ALLOWED_DIDS', undefined))
    const result = oauth2Service.isAllowed('did:web:b.com')

    assert.equal(result, true)
  })

  test('should name connections by client ID without a client', async function ({
    assert,
    cleanup,
  }) {
    await Account.create({ did })
    await Oauth2Grant.create({
      clientId,
      did,
      redirectUri,
      refreshTokenHash: hashToken('a'),
      scope: 'a',
    })
    cleanup(setEnv('OAUTH2_CLIENT_ID', undefined))
    const result = await oauth2Service.listConnections(did)

    assert.deepEqual(
      result.map(function (d) {
        return d.name
      }),
      [clientId]
    )
  })
})
