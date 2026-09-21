import { lookup } from 'bcp-47-match'
import { defaultLocale, isLocale, locales, type Locale } from '#shared/locale'

type Listener = () => undefined | void

const listeners = new Set<Listener>()

/**
 * Name of the cookie storing the preferred locale.
 */
const cookieName = 'locale'

/**
 * Parse a `useSyncExternalStore` snapshot value into a locale.
 *
 * Pure function of its input, so server and client render the same result
 * for the same snapshot value.
 *
 * @param value
 *   Snapshot value.
 * @returns
 *   Locale to use.
 */
export function parse(value: string | undefined): Locale {
  if (isLocale(value)) return value

  if (typeof navigator === 'undefined' || !navigator.languages) return defaultLocale

  const match = lookup([...locales], [...navigator.languages])
  return isLocale(match) ? match : defaultLocale
}

/**
 * Get a server snapshot for `useSyncExternalStore`.
 *
 * @returns
 *   Snapshot.
 */
export function serverSnapshot(): undefined {}

/**
 * Save the preferred locale to a cookie.
 *
 * @param locale
 *   Locale to save.
 * @returns
 *   Nothing.
 */
export function setLocale(locale: Locale): undefined {
  try {
    document.cookie = `${cookieName}=${locale}; path=/; max-age=31536000; samesite=lax`
  } catch {
    return
  }

  for (const listener of listeners) listener()
}

/**
 * Get a client snapshot for `useSyncExternalStore`.
 *
 * @returns
 *   Snapshot.
 */
export function snapshot(): string | undefined {
  if (typeof document === 'undefined') return
  try {
    for (const entry of document.cookie.split('; ')) {
      const [key, value] = entry.split('=')
      if (key === cookieName) return value
    }
  } catch {}
}

/**
 * Subscribe to changes.
 *
 * @param listener
 *   Callback.
 * @returns
 *   Unsubscribe.
 */
export function subscribe(listener: Listener) {
  listeners.add(listener)

  return function (): undefined {
    listeners.delete(listener)
  }
}
