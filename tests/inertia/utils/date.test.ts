import assert from 'node:assert/strict'
import test from 'node:test'
import { formatDate, parseDate } from '../../../inertia/utils/date.ts'

const date = new Date(Date.UTC(2026, 0, 1, 13, 5))
test('formatDate', function () {
  test('should format in `TZ` (`UTC` in `tests/env.ts`)', function () {
    const result = formatDate(date, 'en')

    assert.equal(result, 'Jan 1, 2026, 1:05 PM')
  })

  test('should localize', function () {
    const result = formatDate(date, 'nl')

    assert.equal(result, '1 jan 2026, 13:05')
  })
})

test('parseDate', function () {
  test('should parse', function () {
    const result = parseDate('2026-01-01T00:00:00Z')?.getTime()

    assert.equal(result, Date.UTC(2026, 0, 1))
  })

  for (const value of [undefined, null, '', 'a']) {
    test(`should not parse \`${value}\``, function () {
      const result = parseDate(value)

      assert.equal(result, undefined)
    })
  }
})
