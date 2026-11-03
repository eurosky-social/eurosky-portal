import assert from 'node:assert/strict'
import test from 'node:test'
import { createFieldError } from '#utils/errors'

test('createFieldError', function () {
  test('should create a validation error', function () {
    const result = createFieldError('a', 'b', 'c').code

    assert.equal(result, 'E_VALIDATION_ERROR')
  })

  test('should include the message and the old value', function () {
    const result = createFieldError('a', 'b', 'c').messages

    assert.deepEqual(result, [
      { field: 'a', message: 'c', rule: 'custom' },
      { field: 'old_a', message: 'b', rule: 'custom' },
    ])
  })
})
