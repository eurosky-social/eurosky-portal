import { readdir, readFile } from 'node:fs/promises'
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

const clientSideBase = new URL('../inertia/lib/i18n/', import.meta.url)
const serverSideBase = new URL('../resources/lang/', import.meta.url)

/**
 * Check that translations have the same:
 *
 * * files,
 * * keys,
 * * message placeholders.
 *
 * Two catalog shapes are covered:
 *
 * * client side: flat `inertia/lib/i18n/$locale.ts`
 * * server side: `resources/lang/$locale/$namespace.json`, w/ optional nesting
 */
export default class I18nCheck extends BaseCommand {
  static commandName = 'i18n:check'
  static description = 'Check that translation catalogs are complete and consistent'

  static options: CommandOptions = {
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

      for (const key of baseKeys) {
        const message = catalog[key]

        if (message === undefined) {
          this.logger.error(
            `[${label}] missing key \`${key}\` in locale \`${locale}\`, present in \`${defaultLocale}\``
          )
          ok = false
          continue
        }

        ok = this.checkMessage(label, locale, key, base[key], message) && ok
      }
    }

    return ok
  }

  /**
   * Check client catalogs.
   *
   * @returns
   *   Promise that resolves to whether the catalogs are valid.
   */
  async checkClientCatalogs(): Promise<boolean> {
    let ok = true
    const catalogs = new Map<Locale, Record<string, string>>()

    for (const locale of locales) {
      try {
        const module = await import(new URL(`${locale}.js`, clientSideBase).href)
        catalogs.set(locale, module.default)
      } catch {
        this.logger.error(`[client] missing locale catalog (\`inertia/lib/i18n/${locale}.ts\`)`)
        ok = false
      }
    }

    ok = this.checkCatalogs('client', catalogs) && ok

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
   * Check server catalogs.
   *
   * @returns
   *   Promise that resolves to whether the catalogs are valid.
   */
  async checkServerCatalogs(): Promise<boolean> {
    let localeFolders: Array<string>
    let ok = true

    try {
      localeFolders = await readdir(serverSideBase)
    } catch {
      this.logger.error('[server] cannot read server side catalogs')
      return false
    }

    const filesByLocale = new Map<Locale, Set<string>>()
    const namespaces = new Set<string>()

    for (const locale of locales) {
      if (!localeFolders.includes(locale)) {
        this.logger.error(`[server] missing locale folder (\`resources/lang/${locale}/\`)`)
        ok = false
        continue
      }

      const entries = await readdir(new URL(`${locale}/`, serverSideBase))
      const files = new Set(entries.filter((file) => file.endsWith('.json')))
      filesByLocale.set(locale, files)
      for (const file of files) namespaces.add(file)
    }

    for (const locale of locales) {
      const files = filesByLocale.get(locale)
      if (!files) continue
      for (const namespace of namespaces) {
        if (!files.has(namespace)) {
          this.logger.error(
            `[server] missing locale catalog (\`resources/lang/${locale}/${namespace}\`)`
          )
          ok = false
        }
      }
    }

    for (const namespace of namespaces) {
      const catalogs = new Map<Locale, Record<string, string>>()

      for (const locale of locales) {
        const files = filesByLocale.get(locale)
        if (!files) continue
        if (!files.has(namespace)) continue

        const raw: unknown = JSON.parse(
          await readFile(new URL(`${locale}/${namespace}`, serverSideBase), 'utf8')
        )
        const flat: Record<string, string> = {}

        try {
          flatten(raw, '', flat)
        } catch (error) {
          const reason =
            error && typeof error === 'object' && 'message' in error ? error.message : error
          this.logger.error(
            `[server] problem in locale namespace (\`resources/lang/${locale}/${namespace}\`): ${reason}`
          )
          ok = false
          continue
        }

        catalogs.set(locale, flat)
      }

      ok = this.checkCatalogs(`server/${namespace}`, catalogs) && ok
    }

    return ok
  }

  /**
   * Check i18n.
   */
  async run(): Promise<undefined> {
    const clientOk = await this.checkClientCatalogs()
    const serverOk = await this.checkServerCatalogs()

    if (clientOk && serverOk) {
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

/**
 * Flatten a nested translation file into a single level record,
 * keyed by dotted paths.
 *
 * @param value
 *   Value to flatten.
 * @param path
 *   Current path within the nested structure.
 * @param into
 *   Record to collect into.
 * @returns
 *   Nothing.
 * @throws
 *   When a value is invalid.
 */
function flatten(value: unknown, path: string, into: Record<string, string>): undefined {
  if (typeof value === 'string') {
    into[path] = value
  } else if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, path ? `${path}.${key}` : key, into)
    }
  } else {
    throw new Error(`unsupported value at \`${path}\`: expected \`object\`, \`string\``)
  }
}
