import {
  type MessageFormatElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
} from '@formatjs/icu-messageformat-parser'
import { type FormatXMLElementFn, type PrimitiveType, IntlMessageFormat } from 'intl-messageformat'
import type { ReactNode } from 'react'
import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import type { Locale } from '#shared/locale'
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
 * Translation context.
 */
const I18nContext = createContext<I18nContextValue | undefined>(undefined)

/**
 * Lazy load translation messages for each locale.
 */
const catalogs: Record<Locale, () => Promise<{ default: Record<string, string> }>> = {
  en() {
    return import('./i18n/en')
  },
  nl() {
    return import('./i18n/nl')
  },
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = parse(useSyncExternalStore(subscribe, snapshot, serverSnapshot))
  const [messages, setMessages] = useState<Record<string, string>>({})

  useEffect(
    function (): undefined {
      document.documentElement.lang = locale
    },
    [locale]
  )

  useEffect(
    function () {
      let cancelled = false

      catalogs[locale]().then((module) => {
        if (!cancelled) {
          setMessages(module.default)
        }
      })

      return cancel

      function cancel(): undefined {
        cancelled = true
      }
    },
    [locale]
  )

  const value = useMemo<I18nContextValue>(
    function () {
      const { tPlain, t } = createT(locale, messages)
      return { locale, setLocale, tPlain, t }
    },
    [locale, messages]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
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
    return String(format.format({ ...defaults, ...variables }))
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
    const result = format.format(variables ?? {})

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
