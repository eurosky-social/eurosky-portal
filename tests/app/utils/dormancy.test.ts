import assert from 'node:assert/strict'
import test from 'node:test'
import { DateTime } from 'luxon'
import { dormancyCutoff } from '#utils/dormancy'

test('dormancyCutoff', function () {
  test('should be a month ago', function () {
    const expected = DateTime.now().minus({ months: 1 }).toMillis()
    const result = Math.abs(dormancyCutoff().toMillis() - expected) < 1000

    assert.equal(result, true)
  })
})
