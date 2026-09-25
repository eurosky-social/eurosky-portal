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
  const [messages, setMessages] = useState<Record<string, string> | undefined>()
  const mounted = useRef(false)

  useEffect(
    function (): undefined {
      document.documentElement.lang = locale
    },
    [locale]
  )

  // Some props such as FAQ and the explore document are rendered server side
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
      let cancelled = false

      setMessages(undefined)
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
 *   Translation messages for the current locale or `undefined` while loading.
 * @returns
 *   Translation functions.
 */
function createT(locale: Locale, messages: Record<string, string> | undefined) {
  const compiled = new Map<string, CompiledMessage>()

  return { tPlain, t }

  /**
   * Compile messages once instead of reparsing its ICU syntax on every call.
   *
   * @param key
   *   Message key.
   * @returns
   *   Compiled message or `undefined` while loading.
   * @throws
   *   Throws for malformed ICU syntax.
   */
  function compile(key: string): CompiledMessage | undefined {
    if (!messages) return

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
   *   Rendered and translated message or empty string while loading.
   */
  function tPlain(
    key: string,
    variables?: Record<string, VariableValue<PrimitiveType>> | null | undefined
  ): string {
    const message = compile(key)
    if (!message) return ''
    const { format, names } = message
    const defaults: Record<string, FormatXMLElementFn<PrimitiveType>> = {}
    for (const name of names) defaults[name] = identity
    // `IntlMessageFormat` collapses adjacent strings (`["Jane", "!"]`) already,
    // so no arrays of strings.
    return String(
      format.format({
        ...defaults,
        appBrand: brand.name,
        appTitle: brand.appTitle,
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
   *   Rendered and translated message or `undefined` while loading.
   */
  function t(
    key: string,
    variables?: Record<string, VariableValue<ReactNode>> | null | undefined
  ): ReactNode {
    const message = compile(key)
    if (!message) return
    const { format } = message
    const values: Record<string, VariableValue<ReactNode>> = {
      appBrand: brand.name,
      appTitle: brand.appTitle,
      ...variables,
    }
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
