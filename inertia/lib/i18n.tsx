import { IntlMessageFormat } from 'intl-messageformat'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import type { Locale } from '#shared/locale'
import { parse, serverSnapshot, setLocale, snapshot, subscribe } from '~/utils/locale'

interface I18nContextValue {
  locale: Locale
  setLocale(locale: Locale): undefined
  t(key: string, vars?: Record<string, number | string>): string
}

/**
 * Provide the translation context to the component tree.
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

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = parse(useSyncExternalStore(subscribe, snapshot, serverSnapshot))
  const [messages, setMessages] = useState<Record<string, string>>({})

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
      return { locale, setLocale, t: createT(locale, messages) }
    },
    [locale, messages]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/**
 * Create a translation function for the given locale and messages.
 *
 * @param locale
 *   Current locale.
 * @param messages
 *   Translation messages for the current locale.
 * @returns
 *   Translation function.
 */
function createT(locale: Locale, messages: Record<string, string>) {
  return t

  /**
   * @param key
   *   Message key.
   * @param vars
   *   Variables to interpolate into the message.
   * @returns
   *   Translated message with variables interpolated.
   */
  function t(key: string, variables?: Record<string, number | string> | null | undefined): string {
    const message = messages[key] ?? key

    try {
      // Parameters here match the server side ICU formatter in
      // `@adonisjs/i18n`.
      const messageFormat = new IntlMessageFormat(message, locale, undefined, { ignoreTag: true })
      return String(messageFormat.format(variables ?? undefined))
    } catch {
      // Malformed ICU syntax or a missing variable.
      // Show the raw message rather than crashing the render.
      return message
    }
  }
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
