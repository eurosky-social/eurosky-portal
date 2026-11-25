import cache from '@adonisjs/cache/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import type { Client } from '@atproto/lex'
import { AtUri } from '@atproto/syntax'
import { test } from '@japa/runner'
import * as lexicon from '#lexicons/index'
import { apps } from '#shared/apps'
import { favoriteScope, importScopes, parseScopes, serializeScopes } from '#utils/oauth'
import { authorize, oauthClient } from '../pds.ts'
import { signIn } from './helpers.ts'

const [app] = apps
const scope = serializeScopes(new Set(['atproto', favoriteScope]))

test.group('favorites / asking for more scopes', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should ask for the scope, keeping granted ones', async function ({ assert, client }) {
    if (!app) throw new Error('Expected an app')
    const granted = serializeScopes(importScopes.union(new Set(['atproto'])))
    const { did, repo, user } = await signIn({ scope: granted })
    await cache.set({ key: `atstore:listing:${app.atUri}`, value: {} })
    const response = await client.post(path(app.atUri)).withCsrfToken().loginAs(user).withInertia()
    const parameters = await authorize(new URL(response.header('x-inertia-location') ?? ''), did)
    await client
      .get('/oauth/callback')
      .qs(Object.fromEntries(parameters))
      .withSession(response.session())
      .loginAs(user)
      .redirects(0)
    const session = await oauthClient().restore(did)
    const info = await session.getTokenInfo()

    assert.isTrue(parseScopes(info.scope).isSupersetOf(parseScopes(granted)))
    assert.isTrue(parseScopes(info.scope).has(favoriteScope))
    assert.deepEqual(await getSubjects(repo), [app.atUri])
  })
})

test.group('favorites / limits', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should limit favoriting by person', async function ({ client }) {
    if (!app) throw new Error('Expected an app')
    const { user } = await signIn({ scope })
    await cache.set({ key: `atstore:listing:${app.atUri}`, value: {} })
    const { atUri } = app

    for (let index = 0; index < 30; index++) await request()
    const response = await request()

    response.assertFlashMessage('errorMessage', { key: 'errors.E_TOO_MANY_REQUESTS' })

    function request() {
      return client.post(path(atUri)).withCsrfToken().loginAs(user).withInertia().redirects(0)
    }
  })
})

test.group('favorites / POST and DELETE /apps/:rkey/favorite', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })

  test('should favorite an app in the repo', async function ({ assert, client }) {
    if (!app) throw new Error('Expected an app')
    const { repo, user } = await signIn({ scope })
    await cache.set({ key: `atstore:listing:${app.atUri}`, value: {} })
    await client.post(path(app.atUri)).withCsrfToken().loginAs(user).withInertia()
    const subjects = await getSubjects(repo)

    assert.deepEqual(subjects, [app.atUri])
  })

  test('should favorite an app once', async function ({ assert, client }) {
    if (!app) throw new Error('Expected an app')
    const { repo, user } = await signIn({ scope })
    await cache.set({ key: `atstore:listing:${app.atUri}`, value: {} })
    await client.post(path(app.atUri)).withCsrfToken().loginAs(user).withInertia()
    await client.post(path(app.atUri)).withCsrfToken().loginAs(user).withInertia()
    const subjects = await getSubjects(repo)

    assert.deepEqual(subjects, [app.atUri])
  })

  test('should unfavorite an app in the repo', async function ({ assert, client }) {
    if (!app) throw new Error('Expected an app')
    const { repo, user } = await signIn({ scope })
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
