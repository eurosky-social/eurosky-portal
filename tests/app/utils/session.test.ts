import assert from 'node:assert/strict'
import test from 'node:test'
import {
  flashSessionValue,
  forgetSessionValue,
  getFlashedSessionValue,
  pullSessionValue,
  putSessionValue,
} from '#utils/session'

test('flashSessionValue', function () {
  test('should call `flash`', function () {
    let actual: Array<unknown> = []
    const session = {
      flash(...parameters: Array<unknown>) {
        actual = parameters
      },
    }
    // @ts-expect-error: test runtime behavior.
    flashSessionValue(session, 'errorMessage', { key: 'meta.description' })

    assert.deepEqual(actual, ['errorMessage', { key: 'meta.description' }])
  })
})

test('forgetSessionValue', function () {
  test('should call `forget`', function () {
    let actual: Array<unknown> = []
    const session = {
      forget(...parameters: Array<unknown>) {
        actual = parameters
      },
    }
    // @ts-expect-error: test runtime behavior.
    forgetSessionValue(session, 'handle')

    assert.deepEqual(actual, ['handle'])
  })
})

test('getFlashedSessionValue', function () {
  test('should call `flashMessages.get`', function () {
    const session = {
      flashMessages: {
        get(key: string) {
          return `${key}:a`
        },
      },
    }
    // @ts-expect-error: test runtime behavior.
    const result = getFlashedSessionValue(session, 'errorMessage')

    assert.equal(result, 'errorMessage:a')
  })
})

test('pullSessionValue', function () {
  test('should call `pull`', function () {
    const session = {
      pull(key: string) {
        return `${key}:a`
      },
    }
    // @ts-expect-error: test runtime behavior.
    const result = pullSessionValue(session, 'handle')

    assert.equal(result, 'handle:a')
  })
})

test('putSessionValue', function () {
  test('should call `put`', function () {
    let actual: Array<unknown> = []
    const session = {
      put(...parameters: Array<unknown>) {
        actual = parameters
      },
    }
    // @ts-expect-error: test runtime behavior.
    putSessionValue(session, 'handle', 'a')

    assert.deepEqual(actual, ['handle', 'a'])
  })
})
