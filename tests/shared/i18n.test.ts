import assert from 'node:assert/strict'
import test from 'node:test'
import {
  type MessageFormatElement,
  TYPE,
  isArgumentElement,
  isDateElement,
  isNumberElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
  isTimeElement,
  parse,
} from '@formatjs/icu-messageformat-parser'
import { isMessageKey } from '#shared/i18n'
import { defaultLocale, locales } from '#shared/locale'

// Catalogs in `shared/i18n/$locale.ts`, used on the client and the server.
const catalogs = new Map(
  await Promise.all(
    locales.map(async function (locale) {
      const module: { default: Record<string, string> } = await import(`#shared/i18n/${locale}`)
      return [locale, module.default] as const
    })
  )
)

const base = catalogs.get(defaultLocale)
assert.ok(base)
test('catalogs', function () {
  for (const [locale, catalog] of catalogs) {
    test(`should parse \`${locale}\` as ICU`, function () {
      const result = Object.keys(catalog).filter(function (key) {
        return !parses(catalog[key] ?? '')
      })

      assert.deepEqual(result, [])
    })

    if (locale === defaultLocale) continue

    test(`should have the keys of \`${defaultLocale}\` in \`${locale}\``, function () {
      const result = Object.keys(catalog).sort()

      assert.deepEqual(result, Object.keys(base).sort())
    })

    test(`should use the placeholders of \`${defaultLocale}\` in \`${locale}\``, function () {
      const result = placeholdersByKey(catalog)

      assert.deepEqual(result, placeholdersByKey(base))
    })
  }
})

test('isMessageKey', function () {
  test('should support keys', function () {
    const result = isMessageKey('meta.description')

    assert.equal(result, true)
  })

  test('should not support unknown keys', function () {
    const result = isMessageKey('a')

    assert.equal(result, false)
  })

  test('should not support inherited keys', function () {
    const result = isMessageKey('toString')

    assert.equal(result, false)
  })

  test('should not support other things', function () {
    const result = isMessageKey(1)

    assert.equal(result, false)
  })
})

/**
 * Placeholders per key, for keys with any.
 */
function placeholdersByKey(catalog: Record<string, string>): Record<string, Array<string>> {
  const result: Record<string, Array<string>> = {}

  for (const [key, message] of Object.entries(catalog)) {
    const into = new Set<string>()
    collect(parse(message), into)
    if (into.size > 0) result[key] = [...into].sort()
  }

  return result
}

/**
 * Collect placeholders as `name:type`: a `Date` can be used as both a date
 * and a time (`{a, date, medium}` and `{a, time, short}`).
 */
function collect(elements: ReadonlyArray<MessageFormatElement>, into: Set<string>): undefined {
  for (const element of elements) {
    if (
      isArgumentElement(element) ||
      isDateElement(element) ||
      isNumberElement(element) ||
      isTimeElement(element)
    ) {
      into.add(`${element.value}:${TYPE[element.type]}`)
    } else if (isPluralElement(element) || isSelectElement(element)) {
      into.add(`${element.value}:${TYPE[element.type]}`)
      for (const option of Object.values(element.options)) collect(option.value, into)
    } else if (isTagElement(element)) {
      into.add(`${element.value}:${TYPE[element.type]}`)
      collect(element.children, into)
    }
  }
}

function parses(message: string): boolean {
  try {
    parse(message)
    return true
  } catch {
    return false
  }
}
