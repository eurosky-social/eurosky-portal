import cache from '@adonisjs/cache/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import { XrpcResponseError } from '@atproto/lex'
import { AtUri } from '@atproto/syntax'
import { test } from '@japa/runner'
import * as lexicon from '#lexicons/index'
import { FavoriteService } from '#services/favorite_service'
import { apps } from '#shared/apps'
import { favoriteScope, serializeScopes } from '#utils/oauth'
import { restorePds, signIn } from './helpers.ts'

const did = 'did:web:a.com'
const [app] = apps
const favorite = FavoriteService.prototype.favorite

test.group('favorites / asking for more scopes', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  group.each.teardown(function () {
    FavoriteService.prototype.favorite = favorite
    restorePds()
  })

  test('should keep granted scopes', async function ({ assert, client }) {
    if (!app) throw new Error('Expected an app')
    const pds = await signIn({ did, scope: 'atproto b' })
    // Not to L2 (the database): that is locked by the global transaction.
    await cache.set({ key: `atstore:listing:${app.atUri}`, skipL2Write: true, value: {} })

    FavoriteService.prototype.favorite = async function () {
      throw new XrpcResponseError(
        lexicon.app.bsky.actor.getProfile.main,
        new Response(undefined, { status: 403 }),
        { body: { error: 'ScopeMissingError', message: 'a' }, encoding: 'application/json' }
      )
    }

    await client
      .post('/apps/' + new AtUri(app.atUri).rkey + '/favorite')
      .withCsrfToken()
      .loginAs(pds.user)
      .withInertia()

    assert.deepEqual(
      pds.authorizeCalls.map(function (d) {
        return d.scope
      }),
      [serializeScopes(new Set(['atproto', 'b', favoriteScope]))]
    )
  })
})

test.group('favorites / limits', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  group.each.teardown(function () {
    FavoriteService.prototype.favorite = favorite
    restorePds()
  })

  test('should limit favoriting by person', async function ({ assert, client }) {
    if (!app) throw new Error('Expected an app')
    const { user } = await signIn({ did })
    // Not to L2 (the database): that is locked by the global transaction.
    await cache.set({ key: `atstore:listing:${app.atUri}`, skipL2Write: true, value: {} })
    const path = '/apps/' + new AtUri(app.atUri).rkey + '/favorite'
    let calls = 0
    FavoriteService.prototype.favorite = async function () {
      calls++
    }

    for (let index = 0; index < 30; index++) await request()
    const response = await request()

    response.assertFlashMessage('errorMessage', { key: 'errors.E_TOO_MANY_REQUESTS' })
    assert.equal(calls, 30)

    function request() {
      return client.post(path).withCsrfToken().loginAs(user).withInertia().redirects(0)
    }
  })
})
