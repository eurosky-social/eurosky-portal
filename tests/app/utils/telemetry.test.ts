import assert from 'node:assert/strict'
import test from 'node:test'
import { captureException, captureMessage } from '#utils/telemetry'

test('captureException', function () {
  test('should do nothing without a span', function () {
    const result = captureException(new Error('a'), { extra: { b: 1 } })

    assert.equal(result, undefined)
  })
})

test('captureMessage', function () {
  test('should do nothing without a span', function () {
    const result = captureMessage('a', { level: 'error' })

    assert.equal(result, undefined)
  })
})
