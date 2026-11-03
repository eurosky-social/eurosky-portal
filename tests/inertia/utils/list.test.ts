import assert from 'node:assert/strict'
import test from 'node:test'
import { formatList } from '../../../inertia/utils/list.ts'

test('formatList', function () {
  test('should format a conjunction', function () {
    const result = formatList(['a', 'b', 'c'], 'en')

    assert.equal(result, 'a, b, and c')
  })

  test('should localize', function () {
    const result = formatList(['a', 'b', 'c'], 'nl')

    assert.equal(result, 'a, b en c')
  })

  test('should support options', function () {
    const result = formatList(['a', 'b'], 'en', { type: 'disjunction' })

    assert.equal(result, 'a or b')
  })
})
