import assert from 'node:assert/strict'
import test from 'node:test'
import { isStorageCategory } from '#shared/storage'

test('isStorageCategory', function () {
  test('should support categories', function () {
    const result = isStorageCategory('image')

    assert.equal(result, true)
  })

  test('should not support `all`, which is a tab', function () {
    const result = isStorageCategory('all')

    assert.equal(result, false)
  })
})
