import cache from '@adonisjs/cache/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import { type Client, XrpcResponseError } from '@atproto/lex'
import { AtUri } from '@atproto/syntax'
import { test } from '@japa/runner'
import * as lexicon from '#lexicons/index'
import { FavoriteService } from '#services/favorite_service'
import { apps } from '#shared/apps'
import { favoriteScope, serializeScopes } from '#utils/oauth'
import { restoreOauth, signIn } from './helpers.ts'

const [app] = apps
const favorite = FavoriteService.prototype.favorite

test.group('favorites / asking for more scopes', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  group.each.teardown(function () {
    FavoriteService.prototype.favorite = favorite
    restoreOauth()
  })

  test('should keep granted scopes', async function ({ assert, client }) {
    if (!app) throw new Error('Expected an app')
    const { oauth, user } = await signIn({ scope: 'atproto b' })
    await cache.set({ key: `atstore:listing:${app.atUri}`, value: {} })

    FavoriteService.prototype.favorite = async function () {
      throw new XrpcResponseError(
        lexicon.app.bsky.actor.getProfile.main,
        new Response(undefined, { status: 403 }),
        { body: { error: 'ScopeMissingError', message: 'a' }, encoding: 'application/json' }
      )
    }

    await client.post(path(app.atUri)).withCsrfToken().loginAs(user).withInertia()

    assert.deepEqual(
      oauth.authorizeCalls.map(function (d) {
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
    restoreOauth()
  })

  test('should limit favoriting by person', async function ({ assert, client }) {
    if (!app) throw new Error('Expected an app')
    const { user } = await signIn()
    await cache.set({ key: `atstore:listing:${app.atUri}`, value: {} })
    const { atUri } = app
    let calls = 0
    FavoriteService.prototype.favorite = async function () {
      calls++
    }

    for (let index = 0; index < 30; index++) await request()
    const response = await request()

    response.assertFlashMessage('errorMessage', { key: 'errors.E_TOO_MANY_REQUESTS' })
    assert.equal(calls, 30)

    function request() {
      return client.post(path(atUri)).withCsrfToken().loginAs(user).withInertia().redirects(0)
    }
  })
})

test.group('favorites / POST and DELETE /apps/:rkey/favorite', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })
  group.each.teardown(restoreOauth)

  test('should favorite an app in the repo', async function ({ assert, client }) {
    if (!app) throw new Error('Expected an app')
    const { repo, user } = await signIn()
    await cache.set({ key: `atstore:listing:${app.atUri}`, value: {} })
    await client.post(path(app.atUri)).withCsrfToken().loginAs(user).withInertia()
    const subjects = await getSubjects(repo)

    assert.deepEqual(subjects, [app.atUri])
  })

  test('should favorite an app once', async function ({ assert, client }) {
    if (!app) throw new Error('Expected an app')
    const { repo, user } = await signIn()
    await cache.set({ key: `atstore:listing:${app.atUri}`, value: {} })
    await client.post(path(app.atUri)).withCsrfToken().loginAs(user).withInertia()
    await client.post(path(app.atUri)).withCsrfToken().loginAs(user).withInertia()
    const subjects = await getSubjects(repo)

    assert.deepEqual(subjects, [app.atUri])
  })

  test('should unfavorite an app in the repo', async function ({ assert, client }) {
    if (!app) throw new Error('Expected an app')
    const { repo, user } = await signIn()
    await cache.set({ key: `atstore:listing:${app.atUri}`, value: {} })
    await client.post(path(app.atUri)).withCsrfToken().loginAs(user).withInertia()
    await client.delete(path(app.atUri)).withCsrfToken().loginAs(user).withInertia()
    const subjects = await getSubjects(repo)

    assert.deepEqual(subjects, [])
  })
})

/**
 * Get the subjects of the favorites in the repo.
 */
async function getSubjects(repo: Client): Promise<Array<string>> {
  const { records } = await repo.list(lexicon.fyi.atstore.listing.favorite.main)

  return records.map(function (record) {
    if (!record.valid) throw new Error('Expected a valid favorite')
    return record.value.subject
  })
}

/**
 * Get the path to favorite an app.
 */
function path(atUri: string): string {
  return '/apps/' + new AtUri(atUri).rkey + '/favorite'
}
