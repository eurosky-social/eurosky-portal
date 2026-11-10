import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createState,
  getHandleDomains,
  parseScopes,
  redactCallbackParams,
  serializeScopes,
} from '#utils/oauth'
import { testEnv } from '../../env.ts'

test('createState', function () {
  test('should return 32 random characters', function () {
    const values = new Map<string, unknown>()
    const session = {
      put(key: string, value: unknown) {
        return values.set(key, value)
      },
    }
    // @ts-expect-error: test runtime behavior.
    const result = createState(session)

    assert.match(result, /^[\w-]{32}$/)
  })

  test('should store `oauth_state`', function () {
    const values = new Map<string, unknown>()
    const session = {
      put(key: string, value: unknown) {
        return values.set(key, value)
      },
    }
    // @ts-expect-error: test runtime behavior.
    const state = createState(session)
    const result = values.get('oauth_state')

    assert.equal(result, state)
  })

  test('should be random', function () {
    const session = { put() {} }
    // @ts-expect-error: test runtime behavior.
    const result = createState(session)

    // @ts-expect-error: test runtime behavior.
    assert.notEqual(result, createState(session))
  })
})

test('getHandleDomains', function () {
  test('should use `ATPROTO_HANDLE_DOMAIN`, with a dot', function () {
    const result = getHandleDomains()

    assert.deepEqual(result, ['.' + testEnv.ATPROTO_HANDLE_DOMAIN])
  })
})

test('redactCallbackParams', function () {
  test('should redact OAuth params', function () {
    const result = redactCallbackParams('/a?code=b&iss=c&response=d&state=e')

    assert.equal(result, '/a?code=REDACTED&iss=REDACTED&response=REDACTED&state=REDACTED')
  })

  test('should keep other params', function () {
    const result = redactCallbackParams('/a?code=b&c=d')

    assert.equal(result, '/a?code=REDACTED&c=d')
  })

  test('should not change without OAuth params', function () {
    const result = redactCallbackParams('/a?b=c')

    assert.equal(result, '/a?b=c')
  })

  test('should not change without query', function () {
    const result = redactCallbackParams('/a')

    assert.equal(result, '/a')
  })

  test('should support a bare query', function () {
    const result = redactCallbackParams('code=a', true)

    assert.equal(result, 'code=REDACTED')
  })
})

test('parseScopes', function () {
  test('should parse scopes', function () {
    const result = parseScopes('a b')

    assert.deepEqual(result, new Set(['a', 'b']))
  })

  test('should ignore repeated and extra spaces', function () {
    const result = parseScopes(' a  a b ')

    assert.deepEqual(result, new Set(['a', 'b']))
  })

  test('should support nothing', function () {
    const result = parseScopes(undefined)

    assert.deepEqual(result, new Set())
  })
})

test('serializeScopes', function () {
  test('should sort', function () {
    const result = serializeScopes(new Set(['b', 'a']))

    assert.equal(result, 'a b')
  })

  test('should support nothing', function () {
    const result = serializeScopes(new Set())

    assert.equal(result, '')
  })
})
