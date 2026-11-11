import assert from 'node:assert/strict'
import test from 'node:test'
import { truncate } from '#utils/text'

test('truncate', function () {
  test('should work on an empty string', function () {
    assert.equal(truncate('', { max: 3 }), '')
  })

  test('should keep shorter text', function () {
    assert.equal(truncate('ab', { max: 3 }), 'ab')
  })

  test('should keep short text', function () {
    assert.equal(truncate('abc', { max: 3 }), 'abc')
  })

  test('should cut after the last word that fits', function () {
    assert.equal(truncate('ab cd ef', { max: 7 }), 'ab cd…')
  })

  test('should cut in a word if no word fits', function () {
    assert.equal(truncate('abcdef', { max: 4 }), 'abc…')
  })

  test('should not end in whitespace or punctuation', function () {
    assert.equal(truncate('ab, cd', { max: 5 }), 'ab…')
  })

  test('should count graphemes, not code points', function () {
    assert.equal(truncate('👋🏽👋🏽👋🏽👋🏽', { max: 3 }), '👋🏽👋🏽…')
  })

  test('should find words in languages without spaces', function () {
    assert.equal(truncate('สวัสดีครับผม', { locale: 'th', max: 6 }), 'สวัสดี…')
  })
})
