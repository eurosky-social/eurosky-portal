import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
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
import { type Locale, defaultLocale, locales } from '#shared/locale'

const catalogBase = new URL('../shared/i18n/', import.meta.url)

/**
 * Check that the catalogs in `shared/i18n/$locale.ts`,
 * used on the client and the server, have the same:
 *
 * * keys,
 * * message placeholders.
 */
export default class I18nCheck extends BaseCommand {
  static override commandName = 'i18n:check'
  static override description = 'Check that translation catalogs are complete and consistent'

  static override options: CommandOptions = {
    startApp: false,
  }

  /**
   * Check that every locale defines the same keys as `defaultLocale`, with
   * messages that use the same placeholders (variables, tags, etc).
   *
   * @param label
   *   Subject for log messages.
   * @param catalogs
   *   Map of locales to message catalogs.
   * @returns
   *   Whether the catalogs are valid.
   */
  checkCatalogs(label: string, catalogs: Map<Locale, Record<string, string>>): boolean {
    let ok = true
    const base = catalogs.get(defaultLocale)
    if (!base) return true

    const baseKeys = new Set(Object.keys(base))

    for (const [locale, catalog] of catalogs) {
      if (locale === defaultLocale) continue

      const keys = new Set(Object.keys(catalog))

      for (const key of keys) {
        if (!baseKeys.has(key)) {
          this.logger.error(
            `[${label}] unexpected key \`${key}\` in locale \`${locale}\`, not present in \`${defaultLocale}\``
          )
          ok = false
        }
      }

      for (const [key, baseMessage] of Object.entries(base)) {
        const message = catalog[key]

        if (message === undefined) {
          this.logger.error(
            `[${label}] missing key \`${key}\` in locale \`${locale}\`, present in \`${defaultLocale}\``
          )
          ok = false
          continue
        }

        ok = this.checkMessage(label, locale, key, baseMessage, message) && ok
      }
    }

    return ok
  }

  /**
   * Check the catalogs.
   *
   * @returns
   *   Promise that resolves to whether the catalogs are valid.
   */
  async checkAllCatalogs(): Promise<boolean> {
    let ok = true
    const catalogs = new Map<Locale, Record<string, string>>()

    for (const locale of locales) {
      try {
        const module: { default: Record<string, string> } = await import(
          new URL(`${locale}.js`, catalogBase).href
        )
        catalogs.set(locale, module.default)
      } catch {
        this.logger.error(`[catalog] missing locale catalog (\`shared/i18n/${locale}.ts\`)`)
        ok = false
      }
    }

    ok = this.checkCatalogs('catalog', catalogs) && ok

    return ok
  }

  /**
   * Check that a message uses the same placeholders (variables, tags, etc)
   * as its `defaultLocale` counterpart.
   *
   * @param label
   *   Subject for log messages.
   * @param locale
   *   Locale the message is in.
   * @param key
   *   Message key.
   * @param baseMessage
   *   Message in `defaultLocale`.
   * @param message
   *   Message in `locale`.
   * @returns
   *   Whether the message is valid.
   */
  checkMessage(
    label: string,
    locale: Locale,
    key: string,
    baseMessage: string,
    message: string
  ): boolean {
    let baseTree
    let localeTree

    try {
      baseTree = parse(baseMessage)
    } catch (error) {
      const reason =
        error && typeof error === 'object' && 'message' in error ? error.message : error
      this.logger.error(
        `[${label}] cannot parse ICU syntax in locale \`${defaultLocale}\` for key \`${key}\`: ${reason}`
      )
      return false
    }

    try {
      localeTree = parse(message)
    } catch (error) {
      const reason =
        error && typeof error === 'object' && 'message' in error ? error.message : error
      this.logger.error(
        `[${label}] cannot parse ICU syntax in locale \`${locale}\` for key \`${key}\`: ${reason}`
      )
      return false
    }

    const basePlaceholders = new Set<string>()
    collectPlaceholders(baseTree, basePlaceholders)
    const localePlaceholders = new Set<string>()
    collectPlaceholders(localeTree, localePlaceholders)

    const missing = [...basePlaceholders].filter((p) => !localePlaceholders.has(p))
    const extra = [...localePlaceholders].filter((p) => !basePlaceholders.has(p))

    if (missing.length > 0 || extra.length > 0) {
      const details = [
        ...missing.map((p) => `expected \`${p}\``),
        ...extra.map((p) => `unexpected \`${p}\``),
      ].join(', ')
      this.logger.error(
        `[${label}] unexpected placeholders in \`${locale}\`, compared to \`${defaultLocale}\`, for key \`${key}\`: ${details}`
      )
      return false
    }

    return true
  }

  /**
   * Check i18n.
   */
  override async run(): Promise<undefined> {
    if (await this.checkAllCatalogs()) {
      this.logger.success('Translations are complete and consistent.')
    } else {
      this.exitCode = 1
    }
  }
}

/**
 * Collect placeholders used in a message, as `name:type` strings.
 *
 * Name and type are combined because a given `Date` variable could be used to
 * format both date and time (`{date, date, medium}` and `{date, time, short}`).
 *
 * @param elements
 *   Array of parsed message format elements.
 * @param into
 *   Set to collect into.
 * @returns
 *   Nothing.
 */
function collectPlaceholders(
  elements: ReadonlyArray<MessageFormatElement>,
  into: Set<string>
): undefined {
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
      for (const option of Object.values(element.options)) {
        collectPlaceholders(option.value, into)
      }
    } else if (isTagElement(element)) {
      into.add(`${element.value}:${TYPE[element.type]}`)
      collectPlaceholders(element.children, into)
    } else {
      // Literal or Pound.
    }
  }
}
