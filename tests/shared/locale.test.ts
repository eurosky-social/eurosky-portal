import assert from 'node:assert/strict'
import test from 'node:test'
import { isLocale, localeNames, locales } from '#shared/locale'

test('isLocale', function () {
  test('should support locales', function () {
    const result = isLocale('nl')

    assert.equal(result, true)
  })

  test('should not support locales with a region', function () {
    const result = isLocale('nl-NL')

    assert.equal(result, false)
  })

  test('should not support other things', function () {
    const result = isLocale(undefined)

    assert.equal(result, false)
  })
})

test('localeNames', function () {
  test('should have a name for each locale', function () {
    const result = Object.keys(localeNames).sort()

    assert.deepEqual(result, [...locales].sort())
  })
})
