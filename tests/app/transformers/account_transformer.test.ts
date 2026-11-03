import assert from 'node:assert/strict'
import test from 'node:test'
import Account from '#models/account'
import AccountTransformer from '#transformers/account_transformer'

test('AccountTransformer', function () {
  test('should pick `did` and `handle`', function () {
    const account = new Account().merge({ did: 'did:web:a.com', handle: 'b.com' })
    const result = new AccountTransformer(account).toObject()

    assert.deepEqual(result, { did: 'did:web:a.com', handle: 'b.com' })
  })
})
