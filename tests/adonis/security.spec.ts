import { test } from '@japa/runner'

test.group('security / content security policy', function () {
  test('should send a policy', async function ({ assert, client }) {
    const response = await client.get('/login').withInertia()
    const policy = response.header('content-security-policy') ?? ''

    assert.include(policy, "default-src 'self'")
    assert.include(policy, "frame-ancestors 'none'")
    assert.include(policy, "object-src 'none'")
  })

  test('should only allow scripts from the Portal', async function ({ assert, client }) {
    const response = await client.get('/login').withInertia()
    const policy = response.header('content-security-policy') ?? ''

    // Development adds a nonce, for the inline script React refreshes with.
    assert.match(policy, /script-src 'self'(;|$)/)
  })

  test('should not allow web sockets and blob workers', async function ({ assert, client }) {
    const response = await client.get('/login').withInertia()
    const policy = response.header('content-security-policy') ?? ''

    // Development adds these, for Vite.
    assert.match(policy, /connect-src 'self' https:(;|$)/)
    assert.match(policy, /worker-src 'self'(;|$)/)
  })
})
