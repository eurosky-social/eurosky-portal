import assert from 'node:assert/strict'
import test from 'node:test'
import { commaSeparated } from '#utils/env'

test('commaSeparated', function () {
  test('should split on commas and trim', function () {
    const result = commaSeparated()('A', ' a , b ')

    assert.deepEqual(result, ['a', 'b'])
  })

  test('should drop empty items', function () {
    const result = commaSeparated()('A', 'a,,b,')

    assert.deepEqual(result, ['a', 'b'])
  })

  test('should be `undefined` if not set', function () {
    const result = commaSeparated()('A', undefined)

    assert.equal(result, undefined)
  })

  test('should be `undefined` if empty', function () {
    const result = commaSeparated()('A', '')

    assert.equal(result, undefined)
  })

  test('should validate each item', function () {
    const result = commaSeparated(function (key, value) {
      return key + ':' + value
    })('A', 'a,b')

    assert.deepEqual(result, ['A:a', 'A:b'])
  })
})
