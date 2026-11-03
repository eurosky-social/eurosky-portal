import { test } from '@japa/runner'
import { activityDetailValidator, activityQueryValidator } from '#validators/activity'

test.group('validators / activity / activityDetailValidator', function () {
  test('should accept a record', async function ({ assert }) {
    const params = { collection: 'app.bsky.feed.post', rkey: 'a.b:c~d-e_f' }
    const result = await activityDetailValidator.validate({ params })

    assert.deepEqual(result, { params })
  })

  test('should reject an unsupported collection', async function ({ assert }) {
    const [error] = await activityDetailValidator.tryValidate({
      params: { collection: 'a.b.c', rkey: 'a' },
    })

    assert.notEqual(error, null)
  })

  for (const rkey of ['.', '..', 'a/b', 'a'.repeat(513)]) {
    const display = rkey.length > 8 ? `${rkey.slice(0, 7)}…` : rkey
    test(`should reject invalid record keys (\`${display}\`)`, async function ({ assert }) {
      const [error] = await activityDetailValidator.tryValidate({
        params: { collection: 'app.bsky.feed.post', rkey },
      })

      assert.notEqual(error, null)
    })
  }
})

test.group('validators / activity / activityQueryValidator', function () {
  test('should turn `limit` into a number', async function ({ assert }) {
    const result = await activityQueryValidator.validate({ limit: '5' })

    assert.deepEqual(result, { limit: 5 })
  })

  for (const limit of [0, 1001]) {
    test(`should reject \`${limit}\` as \`limit\``, async function ({ assert }) {
      const [error] = await activityQueryValidator.tryValidate({ limit })

      assert.notEqual(error, null)
    })
  }
})
