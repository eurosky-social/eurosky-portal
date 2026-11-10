import { test } from '@japa/runner'
import { loginRequestValidator } from '#validators/oauth'
import { testEnv } from '../../env.ts'

const domain = testEnv.ATPROTO_HANDLE_DOMAIN

test.group('validators / oauth / loginRequestValidator', function () {
  for (const [input, expected] of [
    ['a', 'a'],
    ['a.b.com', 'a.b.com'],
    ['@a', 'a'],
    [`@a.${domain}`, `a.${domain}`],
    [`a@${domain}`, `a.${domain}`],
    [`@a@${domain}`, `a.${domain}`],
    [`A@${domain.toUpperCase()}`, `A.${domain}`],
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
})
