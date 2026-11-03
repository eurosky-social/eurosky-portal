import { test } from '@japa/runner'
import Account from '#models/account'
import AccountTransformer from '#transformers/account_transformer'

test.group('transformers / AccountTransformer', function () {
  test('should pick `did` and `handle`', async function ({ assert }) {
    const account = new Account().merge({ did: 'did:web:a.com', handle: 'b.com' })
    const result = new AccountTransformer(account).toObject()

    assert.deepEqual(result, { did: 'did:web:a.com', handle: 'b.com' })
  })
})
