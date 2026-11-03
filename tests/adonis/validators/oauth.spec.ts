import { test } from '@japa/runner'
import { loginRequestValidator } from '#validators/oauth'

test.group('validators / oauth / loginRequestValidator', function () {
  for (const [input, expected] of [
    ['a', 'a'],
    ['a.b.com', 'a.b.com'],
    ['@a.pds.example.com', 'a.pds.example.com'],
    ['a@pds.example.com', 'a.pds.example.com'],
    ['@a@pds.example.com', 'a.pds.example.com'],
    ['A@PDS.EXAMPLE.COM', 'A.pds.example.com'],
    ['did:web:a.com', 'did:web:a.com'],
    ['https://a.com', 'https://a.com'],
  ]) {
    test(`should turn \`${input}\` into \`${expected}\``, async function ({ assert }) {
      const result = await loginRequestValidator.validate({ input })

      assert.deepEqual(result, { input: expected })
    })
  }

  for (const [input, rule] of [
    ['a@b.com', 'at-handle'],
    ['a b', 'at-handle-username'],
    ['', 'at-handle-username'],
  ]) {
    test(`should reject \`${input}\` with \`${rule}\``, async function ({ assert }) {
      const [error] = await loginRequestValidator.tryValidate({ input })

      assert.deepEqual(
        error?.messages.map(function (message: { rule: string }) {
          return message.rule
        }),
        [rule]
      )
    })
  }

  test('should reject `@a`', async function ({ assert }) {
    const [error] = await loginRequestValidator.tryValidate({ input: '@a' })

    // To do: should be valid, as `a` (like `@a.pds.example.com` is `a.pds.example.com`).
    // The `@` is only stripped for values that already look like handles;
    // `@a` does not, so `vine.atproto.handleUsername()` gets and rejects it.
    assert.deepEqual(
      error?.messages.map(function (message: { rule: string }) {
        return message.rule
      }),
      ['at-handle-username']
    )
  })
})
