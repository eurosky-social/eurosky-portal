import assert from 'node:assert/strict'
import test from 'node:test'
import { isTheme } from '#shared/theme'

test('isTheme', function () {
  test('should support themes', function () {
    const result = isTheme('dark')

    assert.equal(result, true)
  })

  test('should not support other things', function () {
    const result = isTheme('a')

    assert.equal(result, false)
  })
})
