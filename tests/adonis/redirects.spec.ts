import { test } from '@japa/runner'

test.group('redirects', function () {
  test('should redirect `/legal/terms` to `eurosky.tech`', async function ({ client }) {
    const response = await client.get('/legal/terms').redirects(0)

    response.assertHeader('location', 'https://eurosky.tech/accounts/terms/')
    response.assertStatus(301)
  })

  test('should redirect `/legal/privacy` to `eurosky.tech`', async function ({ client }) {
    const response = await client.get('/legal/privacy').redirects(0)

    response.assertHeader('location', 'https://eurosky.tech/accounts/privacy/')
    response.assertStatus(301)
  })

  test('should redirect `/explore/learn-more` to `eurosky.tech`', async function ({ client }) {
    const response = await client.get('/explore/learn-more').redirects(0)

    response.assertHeader('location', 'https://eurosky.tech/products/')
    response.assertStatus(302)
  })

  test('should localize by `Accept-Language`', async function ({ client }) {
    const response = await client
      .get('/explore/learn-more')
      .header('accept-language', 'nl-NL,nl;q=0.9')
      .redirects(0)

    response.assertHeader('location', 'https://eurosky.tech/nl/products/')
  })

  test('should redirect the old `/dashboard/explore`', async function ({ client }) {
    const response = await client.get('/dashboard/explore').redirects(0)

    response.assertHeader('location', '/explore/learn-more')
    response.assertStatus(302)
  })
})
