import assert from 'node:assert/strict'
import test from 'node:test'
import type { AtUriParts } from '@atproto/syntax'
import { type AtTagUriParts, apps } from '#shared/apps'

const did = 'did:web:a.com'
const post: AtUriParts = { authority: did, collection: 'app.bsky.feed.post', rkey: 'b' }
const document: AtUriParts = { authority: did, collection: 'site.standard.document', rkey: 'b' }
const profile: AtUriParts = { authority: did }
const tag: AtTagUriParts = { tag: 'b c' }
const leaflet = apps.find(function (app) {
  return app.atUri.endsWith('/3mkijfr6sts5l')
})?.launcher
const standardReader = apps.find(function (app) {
  return app.atUri.endsWith('/3mpjb3fty62nt')
})?.launcher

test('apps', function () {
  test('should be unique', function () {
    const uris = apps.map(function (app) {
      return app.atUri
    })
    const result = new Set(uris).size

    assert.equal(result, uris.length)
  })

  test('should be atstore listings', function () {
    const pattern = /^at:\/\/did:plc:[a-z2-7]{24}\/fyi\.atstore\.listing\.detail\/\w+$/
    const result = apps.filter(function (app) {
      return !pattern.test(app.atUri)
    })

    assert.deepEqual(result, [])
  })
})

// Same launchers, different hosts.
for (const [name, rkey, host] of [
  ['Bluesky', '3mj667g65ct2x', 'bsky.app'],
  ['Mu', '3mqmb7emiusy5', 'mu.social'],
] as const) {
  const launcher = apps.find(function (app) {
    return app.atUri.endsWith(`/${rkey}`)
  })?.launcher

  test(`${name}: fromAtUri`, function () {
    test('should open profiles', function () {
      const result = launcher?.fromAtUri(profile)

      assert.equal(result, `https://${host}/profile/${did}`)
    })

    test('should open posts', function () {
      const result = launcher?.fromAtUri(post)

      assert.equal(result, `https://${host}/profile/${did}/post/b`)
    })

    test('should open tags', function () {
      const result = launcher?.fromAtUri(tag)

      assert.equal(result, `https://${host}/hashtag/b%20c`)
    })

    test('should not open documents', function () {
      const result = launcher?.fromAtUri(document)

      assert.equal(result, undefined)
    })
  })

  test(`${name}: toAtUri`, function () {
    test('should support profiles', function () {
      const result = launcher?.toAtUri(new URL(`https://${host}/profile/a.com`))

      assert.deepEqual(result, {
        authority: 'a.com',
      })
    })

    test('should support posts', function () {
      const result = launcher?.toAtUri(new URL(`https://${host}/profile/a.com/post/b`))

      assert.deepEqual(result, {
        authority: 'a.com',
        collection: 'app.bsky.feed.post',
        rkey: 'b',
      })
    })

    test('should support tags', function () {
      const result = launcher?.toAtUri(new URL(`https://${host}/hashtag/b%20c`))

      assert.deepEqual(result, tag)
    })

    test('should not support other hosts', function () {
      const result = launcher?.toAtUri(new URL('https://a.com/profile/a.com'))

      assert.equal(result, undefined)
    })

    test('should not support other paths', function () {
      const result = launcher?.toAtUri(new URL(`https://${host}/settings`))

      assert.equal(result, undefined)
    })

    test('should not support invalid handles', function () {
      const result = launcher?.toAtUri(new URL(`https://${host}/profile/!`))

      assert.equal(result, undefined)
    })

    test('should not support invalid tags', function () {
      const result = launcher?.toAtUri(new URL(`https://${host}/hashtag/%E0%A4%A`))

      assert.equal(result, undefined)
    })
  })
}

test('Leaflet: fromAtUri', function () {
  test('should open documents', function () {
    const result = leaflet?.fromAtUri(document)

    assert.equal(result, `https://leaflet.pub/p/${did}/b`)
  })

  test('should not open profiles', function () {
    const result = leaflet?.fromAtUri(profile)

    assert.equal(result, undefined)
  })

  test('should not open posts', function () {
    const result = leaflet?.fromAtUri(post)

    assert.equal(result, undefined)
  })

  test('should not open tags', function () {
    const result = leaflet?.fromAtUri(tag)

    assert.equal(result, undefined)
  })
})

test('Leaflet: toAtUri', function () {
  test('should support documents', function () {
    const result = leaflet?.toAtUri(new URL('https://leaflet.pub/p/a.com/b'))

    assert.deepEqual(result, {
      authority: 'a.com',
      collection: 'site.standard.document',
      rkey: 'b',
    })
  })

  test('should support profiles', function () {
    const result = leaflet?.toAtUri(new URL('https://leaflet.pub/p/a.com'))

    assert.deepEqual(result, {
      authority: 'a.com',
    })
  })

  test('should not support invalid handles', function () {
    const result = leaflet?.toAtUri(new URL('https://leaflet.pub/p/!'))

    assert.equal(result, undefined)
  })

  test('should not support other paths', function () {
    const result = leaflet?.toAtUri(new URL('https://leaflet.pub/a'))

    assert.equal(result, undefined)
  })

  test('should not support other hosts', function () {
    const result = leaflet?.toAtUri(new URL('https://a.com/p/a.com'))

    assert.equal(result, undefined)
  })
})

test('Standard reader: fromAtUri', function () {
  test('should open documents', function () {
    const result = standardReader?.fromAtUri(document)

    assert.equal(result, `https://standard-reader.app/a/${did}/b`)
  })

  test('should not open profiles', function () {
    const result = standardReader?.fromAtUri(profile)

    assert.equal(result, undefined)
  })

  test('should not open posts', function () {
    const result = standardReader?.fromAtUri(post)

    assert.equal(result, undefined)
  })

  test('should not open tags', function () {
    const result = standardReader?.fromAtUri(tag)

    assert.equal(result, undefined)
  })
})

test('Standard reader: toAtUri', function () {
  test('should support documents', function () {
    const result = standardReader?.toAtUri(new URL('https://standard-reader.app/a/a.com/b'))

    assert.deepEqual(result, {
      authority: 'a.com',
      collection: 'site.standard.document',
      rkey: 'b',
    })
  })

  test('should support profiles', function () {
    const result = standardReader?.toAtUri(new URL('https://standard-reader.app/u/a.com'))

    assert.deepEqual(result, {
      authority: 'a.com',
    })
  })

  test('should not support invalid handles', function () {
    const result = standardReader?.toAtUri(new URL('https://standard-reader.app/a/!/b'))

    assert.equal(result, undefined)
  })

  test('should not support other hosts', function () {
    const result = standardReader?.toAtUri(new URL('https://a.com/u/a.com'))

    assert.equal(result, undefined)
  })
})
