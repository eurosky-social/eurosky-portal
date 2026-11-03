import { test } from '@japa/runner'

test.group('health / GET /_health', function () {
  test('should be ok', async function ({ client }) {
    const response = await client.get('/_health')

    response.assertStatus(200)
    response.assertTextIncludes('ok')
  })
})

test.group('health / GET /_readiness', function () {
  test('should be ok', async function ({ client }) {
    const response = await client.get('/_readiness')

    response.assertStatus(200)
  })

  test('should be healthy', async function ({ assert, client }) {
    const response = await client.get('/_readiness')

    assert.equal(response.body().data.isHealthy, true)
  })
})
