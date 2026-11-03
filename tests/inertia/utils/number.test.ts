import assert from 'node:assert/strict'
import test from 'node:test'
import { formatNumber } from '../../../inertia/utils/number.ts'

test('formatNumber', function () {
  test('should format', function () {
    const result = formatNumber(1234.5, 'en')

    assert.equal(result, '1,234.5')
  })

  test('should localize', function () {
    const result = formatNumber(1234.5, 'de')

    assert.equal(result, '1.234,5')
  })
})
