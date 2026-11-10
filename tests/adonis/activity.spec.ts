import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { restorePds, signIn } from './helpers.ts'

const did = 'did:web:a.com'

test.group('activity / GET /activity/:collection/:rkey', function (group) {
  group.each.setup(function () {
    return testUtils.db().wrapInGlobalTransaction()
  })
  group.each.teardown(restorePds)

  test('should limit viewing details by person', async function ({ client }) {
    const { user } = await signIn({ did })
    // Not found, as there are no records, which needs no network.
    for (let index = 0; index < 60; index++) await request()
    const response = await request()

    response.assertStatus(429)

    function request() {
      return client.get('/activity/app.bsky.feed.post/a').loginAs(user).redirects(0)
    }
  })
})
