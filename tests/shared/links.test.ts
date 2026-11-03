import assert from 'node:assert/strict'
import test from 'node:test'
import { links, localizeMigration } from '#shared/links'
import { locales } from '#shared/locale'

test('links', function () {
  test('should localize by path for `de`, `fr`, `nl`', function () {
    const result = links.products('nl')

    assert.equal(result, 'https://eurosky.tech/nl/products/')
  })

  test('should use the default for English', function () {
    const result = links.products('en')

    assert.equal(result, 'https://eurosky.tech/products/')
  })

  test('should use the default without a page in that locale', function () {
    const result = links.products('ca')

    assert.equal(result, 'https://eurosky.tech/products/')
  })

  for (const [name, link] of Object.entries(links)) {
    test(`should use \`https:\` for \`${name}\``, function () {
      const result = locales.filter(function (locale) {
        return new URL(link(locale)).protocol !== 'https:'
      })

      assert.deepEqual(result, [])
    })
  }
})

test('localizeMigration', function () {
  test('should add `locale`', function () {
    const result = localizeMigration('https://a.com/?b=c', 'fr')

    assert.equal(result, 'https://a.com/?b=c&locale=fr')
  })

  test('should replace `locale`', function () {
    const result = localizeMigration('https://a.com/?locale=nl', 'fr')

    assert.equal(result, 'https://a.com/?locale=fr')
  })
})
