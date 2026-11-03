import assert from 'node:assert/strict'
import test from 'node:test'
import { parse, snapshot, subscribe } from '../../../inertia/utils/locale.ts'

test('parse', function () {
  test('should parse locales', function () {
    const result = parse('nl', 'en')

    assert.equal(result, 'nl')
  })

  test('should use the fallback for unknown locales', function () {
    const result = parse('a', 'en')

    assert.equal(result, 'en')
  })

  test('should use the fallback without locale', function () {
    const result = parse(undefined, 'de')

    assert.equal(result, 'de')
  })
})

test('snapshot', function () {
  test('should be nothing without `document`', function () {
    const result = snapshot()

    assert.equal(result, undefined)
  })
})

test('subscribe', function () {
  test('should return an unsubscribe function', function () {
    const unsubscribe = subscribe(function () {})
    const result = unsubscribe()

    assert.equal(result, undefined)
  })
})
