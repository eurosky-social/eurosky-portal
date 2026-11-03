import { test } from '@japa/runner'
import { SlingshotResolveError, SlingshotService } from '#services/slingshot_service'

const did = 'did:web:a.com'
const doc = { did, handle: 'b.com', pds: 'https://c.com' }

test.group('services / slingshot / resolveMiniDoc', function () {
  test('should resolve', async function ({ assert }) {
    const service = new SlingshotService(async function () {
      return Response.json(doc)
    })
    const result = await service.resolveMiniDoc('b.com')

    assert.deepEqual(result, doc)
  })

  test('should request `resolveMiniDoc`', async function ({ assert }) {
    let actual: string | undefined
    const service = new SlingshotService(async function (input) {
      actual = String(input)
      return Response.json(doc)
    })
    await service.resolveMiniDoc('b.com')

    assert.equal(
      actual,
      'https://slingshot.microcosm.blue/xrpc/blue.microcosm.identity.resolveMiniDoc?identifier=b.com'
    )
  })

  test('should not resolve when not found', async function ({ assert }) {
    const service = new SlingshotService(async function () {
      return Response.json({ error: 'a' }, { status: 400 })
    })
    const result = await service.resolveMiniDoc('b.com')

    assert.equal(result, undefined)
  })

  test('should throw on an invalid response', async function ({ assert }) {
    const service = new SlingshotService(async function () {
      return Response.json({ ...doc, did: 'a' })
    })

    await assert.rejects(function () {
      return service.resolveMiniDoc('b.com')
    }, SlingshotResolveError)
  })

  test('should throw when `fetch` fails', async function ({ assert }) {
    const service = new SlingshotService(async function () {
      throw new TypeError('a')
    })

    await assert.rejects(function () {
      return service.resolveMiniDoc('b.com')
    }, /Unable to resolve identity with slingshot: b\.com/)
  })

  test('should not resolve when aborted', async function ({ assert }) {
    const service = new SlingshotService(async function () {
      throw new DOMException('a', 'AbortError')
    })
    const result = await service.resolveMiniDoc('b.com')

    assert.equal(result, undefined)
  })
})
