import { lookup } from 'bcp-47-match'
import { defaultLocale, isLocale, locales, type Locale } from '#shared/locale'

type Listener = () => undefined | void

const listeners = new Set<Listener>()

/**
 * Get the current locale right now outside of React.
 * Useful for an outgoing request header.
 *
 * @returns
 *   Locale to use.
 */
export function getLocale(): Locale {
  return parse(snapshot())
}

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
 * Save the preferred locale to local storage.
 *
 * @param locale
 *   Locale to save.
 * @returns
 *   Nothing.
 */
export function setLocale(locale: Locale): undefined {
  try {
    localStorage.setItem('language', locale)
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
  if (typeof localStorage === 'undefined') return
  try {
    return localStorage.getItem('language') || undefined
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
