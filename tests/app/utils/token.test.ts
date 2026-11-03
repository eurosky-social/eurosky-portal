import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeToken, encodeToken } from '#utils/token'

test('decodeToken', function () {
  test('should decode', function () {
    const result = decodeToken('eyJhIjoxfQ')

    assert.deepEqual(result, { a: 1 })
  })

  test('should not decode arrays', function () {
    const result = decodeToken(encodeToken([1]))

    assert.equal(result, undefined)
  })

  test('should not decode `null`', function () {
    const result = decodeToken(Buffer.from('null').toString('base64url'))

    assert.equal(result, undefined)
  })

  test('should not decode other things', function () {
    const result = decodeToken('!')

    assert.equal(result, undefined)
  })
})

test('encodeToken', function () {
  test('should encode as base64url JSON', function () {
    const result = encodeToken({ a: 1 })

    assert.equal(result, 'eyJhIjoxfQ')
  })
})
