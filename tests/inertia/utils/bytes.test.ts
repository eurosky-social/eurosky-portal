import assert from 'node:assert/strict'
import test from 'node:test'
import { formatByteSize } from '../../../inertia/utils/bytes.ts'

test('formatByteSize', function () {
  test('should format zero', function () {
    const result = formatByteSize(0, 'en')

    assert.equal(result, '0 B')
  })

  test('should use bytes below 1 KiB', function () {
    const result = formatByteSize(1023, 'en')

    assert.equal(result, '1,023 B')
  })

  test('should use one fraction digit in bigger units', function () {
    const result = formatByteSize(1536, 'en')

    assert.equal(result, '1.5 KiB')
  })

  test('should localize', function () {
    const result = formatByteSize(1536, 'nl')

    assert.equal(result, '1,5 KiB')
  })

  test('should use GiB', function () {
    const result = formatByteSize(1024 ** 3, 'en')

    assert.equal(result, '1 GiB')
  })

  test('should cap at PiB', function () {
    const result = formatByteSize(1024 ** 6, 'en')

    assert.equal(result, '1,024 PiB')
  })
})
