import {
  type MessageFormatElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
} from '@formatjs/icu-messageformat-parser'
import { router } from '@inertiajs/react'
import { type FormatXMLElementFn, type PrimitiveType, IntlMessageFormat } from 'intl-messageformat'
import type { ReactNode } from 'react'
import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { Locale } from '#shared/locale'
import { brand } from '#shared/brand'
import { parse, serverSnapshot, setLocale, snapshot, subscribe } from '~/utils/locale'

type VariableValue<T> = FormatXMLElementFn<T> | PrimitiveType | T

interface I18nContextValue {
  locale: Locale
  setLocale(locale: Locale): undefined
  tPlain(
    key: string,
    variables?: Record<string, VariableValue<PrimitiveType>> | null | undefined
  ): string
  t(key: string, variables?: Record<string, VariableValue<ReactNode>> | null | undefined): ReactNode
}

/**
 * Compiled message.
 */
interface CompiledMessage {
  /**
   * Formatter.
   */
  format: IntlMessageFormat

  /**
   * Names of tags used in message.
   */
  names: ReadonlySet<string>
}

/**
 * Properties.
 */
interface Properties {
  /**
   * Content.
   */
  children: ReactNode

  /**
   * Locale detected by the server.
   */
  locale: Locale

  /**
   * Translation messages (see {@linkcode loadMessages}) for first render on server.
   */
  messages: Record<string, string>
}

/**
 * Translation context.
 */
const I18nContext = createContext<I18nContextValue | undefined>(undefined)

/**
 * Lazy load translation messages for each locale.
 */
const catalogs: Record<Locale, () => Promise<{ default: Record<string, string> }>> = {
  ca() {
    return import('./i18n/ca')
  },
  de() {
    return import('./i18n/de')
  },
  en() {
    return import('./i18n/en')
  },
  fr() {
    return import('./i18n/fr')
  },
  nl() {
    return import('./i18n/nl')
  },
}

/**
 * Load the messages of a locale.
 *
 * @param locale
 *   Locale.
 * @returns
 *   Messages.
 */
export async function loadMessages(locale: Locale): Promise<Record<string, string>> {
  const module = await catalogs[locale]()
  return module.default
}

/**
 * Provide translations.
 */
export function I18nProvider(properties: Properties) {
  const locale = parse(useSyncExternalStore(subscribe, snapshot, serverSnapshot), properties.locale)
  const [loaded, setLoaded] = useState({
    locale: properties.locale,
    messages: properties.messages,
  })
  const mounted = useRef(false)

  useEffect(
    function (): undefined {
      document.documentElement.lang = locale
    },
    [locale]
  )

  // Some props such as FAQ are rendered server side
  // in the request locale.
  // Reload to pick up the new one but skip the initial mount.
  useEffect(
    function (): undefined {
      if (mounted.current) {
        router.reload()
      } else {
        mounted.current = true
      }
    },
    [locale]
  )

  useEffect(
    function () {
      if (loaded.locale === locale) return

      let cancelled = false

      loadMessages(locale).then((messages) => {
        if (!cancelled) {
          setLoaded({ locale, messages })
        }
      })

      return cancel

      function cancel(): undefined {
        cancelled = true
      }
    },
    [locale, loaded.locale]
  )

  const value = useMemo<I18nContextValue>(
    function () {
      const { tPlain, t } = createT(loaded.locale, loaded.messages)
      return { locale, setLocale, tPlain, t }
    },
    [locale, loaded]
  )

  return <I18nContext.Provider value={value}>{properties.children}</I18nContext.Provider>
}

/**
 * Find the names of tags used in a parsed message (so
 * `link` for `<link>text</link>`).
 *
 * @param elements
 *   Parsed elements.
 * @param names
 *   Set to add to.
 * @returns
 *   Nothing; `names` is mutated.
 */
function collectTagNames(
  elements: ReadonlyArray<MessageFormatElement>,
  names: Set<string>
): undefined {
  for (const element of elements) {
    if (isPluralElement(element) || isSelectElement(element)) {
      for (const option of Object.values(element.options)) {
        collectTagNames(option.value, names)
      }
    } else if (isTagElement(element)) {
      names.add(element.value)
      collectTagNames(element.children, names)
    }
  }
}

/**
 * Create translation functions for the given locale and messages.
 *
 * @param locale
 *   Current locale.
 * @param messages
 *   Translation messages for the current locale.
 * @returns
 *   Translation functions.
 */
function createT(locale: Locale, messages: Record<string, string>) {
  const compiled = new Map<string, CompiledMessage>()

  return { tPlain, t }

  /**
   * Compile messages once instead of reparsing its ICU syntax on every call.
   *
   * @param key
   *   Message key.
   * @returns
   *   Compiled message.
   * @throws
   *   Throws for malformed ICU syntax.
   */
  function compile(key: string): CompiledMessage {
    let message = compiled.get(key)

    if (!message) {
      const raw = messages[key] ?? key
      const format = new IntlMessageFormat(raw, locale)
      const names = new Set<string>()
      collectTagNames(format.getAst(), names)
      message = { format, names }
      compiled.set(key, message)
    }

    return message
  }

  /**
   * Like `t`, but always plain string.
   * Tags w/o entry in `variables` fall back to their content instead of
   * throwing.
   *
   * @param key
   *   Message key.
   * @param variables
   *   Variables and components.
   * @returns
   *   Rendered and translated message.
   */
  function tPlain(
    key: string,
    variables?: Record<string, VariableValue<PrimitiveType>> | null | undefined
  ): string {
    const { format, names } = compile(key)
    const defaults: Record<string, FormatXMLElementFn<PrimitiveType>> = {}
    for (const name of names) defaults[name] = identity
    // `IntlMessageFormat` collapses adjacent strings (`["Jane", "!"]`) already,
    // so no arrays of strings.
    return String(
      format.format({
        ...defaults,
        ...brand,
        ...variables,
      })
    )
  }

  /**
   * Translate a message.
   * Supports variables (such as `{ name: "Jane" }`).
   * Also supports markup tags (such as `"Some <link>text</link>"`),
   * each resolved by a matching function in `variables`
   * (such as `{ link: (chunks) => <a href="/">{chunks}</a> }`).
   *
   * @param key
   *   Message key.
   * @param variables
   *   Variables and components.
   * @returns
   *   Rendered and translated message.
   */
  function t(
    key: string,
    variables?: Record<string, VariableValue<ReactNode>> | null | undefined
  ): ReactNode {
    const { format } = compile(key)
    const values: Record<string, VariableValue<ReactNode>> = { ...brand, ...variables }
    const result = format.format(values)

    // Add React keys for automatically generated elements.
    if (Array.isArray(result)) {
      let index = -1
      while (++index < result.length) {
        const part = result[index]
        if (part && typeof part === 'object' && 'type' in part) {
          result[index] = cloneElement(part, { key: index })
        }
      }
    }

    return result
  }
}

/**
 * Identity.
 *
 * @param value
 *   Value.
 * @returns
 *   Same value.
 */
function identity<T>(value: T): T {
  return value
}

/**
 * Get the translation context.
 *
 * @returns
 *   Content.
 */
export function useT() {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('`useT` must be used within `<I18nProvider>`')
  }

  return context
}
