import cache from '@adonisjs/cache/services/main'
import { test } from '@japa/runner'

const tree = { children: [{ type: 'text', value: 'a' }], type: 'root' }

test.group('auth / guests', function () {
  for (const path of ['/activity', '/dashboard', '/files', '/onboarding']) {
    test(`should redirect \`${path}\` to \`/login\``, async function ({ client }) {
      const response = await client.get(path).redirects(0)

      response.assertHeader('location', '/login')
      response.assertStatus(302)
    })
  }
})

test.group('auth / GET /create-account', function () {
  test('should render `create-account`', async function ({ client }) {
    await cache.set({ key: 'legal:privacy', value: { effectiveAt: '2026-01-01', tree } })
    await cache.set({ key: 'legal:terms', value: { effectiveAt: '2026-01-01', tree } })

    const response = await client.get('/create-account').withInertia()

    response.assertInertiaComponent('create-account')
    response.assertStatus(200)
  })

  test('should include the legal documents', async function ({ client }) {
    await cache.set({ key: 'legal:privacy', value: { effectiveAt: '2026-01-01', tree } })
    await cache.set({ key: 'legal:terms', value: { effectiveAt: '2026-01-01', tree } })

    const response = await client.get('/create-account').withInertia()

    response.assertInertiaPropsContains({ legalDocuments: { privacy: tree, terms: tree } })
  })
})

test.group('auth / GET /login', function () {
  test('should render `login`', async function ({ client }) {
    const response = await client.get('/login').withInertia()

    response.assertInertiaComponent('login')
    response.assertStatus(200)
  })

  test('should include the migration service', async function ({ client }) {
    const response = await client.get('/login').withInertia()

    response.assertInertiaPropsContains({ migrationUrl: 'https://move.example.com/' })
  })
})
