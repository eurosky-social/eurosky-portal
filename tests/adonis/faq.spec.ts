import { test } from '@japa/runner'
import type { Nodes } from 'hast'

test.group('faq / GET /faq', function () {
  test('should render `faq/show`', async function ({ client }) {
    const response = await client.get('/faq').withInertia()

    response.assertInertiaComponent('faq/show')
    response.assertStatus(200)
  })

  test('should include entries', async function ({ assert, client }) {
    const response = await client.get('/faq').withInertia()

    assert.equal(Array.isArray(response.inertiaProps.faq), true)
    assert.notEqual(response.inertiaProps.faq.length, 0)
  })

  test('should include answers as hast trees', async function ({ assert, client }) {
    const response = await client.get('/faq').withInertia()
    const faq: Array<{ answer: Nodes; question: string }> = response.inertiaProps.faq

    for (const [index, entry] of faq.entries()) {
      assert.equal(entry.answer.type, 'root', String(index))
    }
  })
})
