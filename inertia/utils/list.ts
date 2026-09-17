import type { Locale } from '#shared/locale'

/**
 * Format a list of strings for display.
 *
 * @param items
 *   Strings to join.
 * @param locale
 *   Locale to format with.
 * @returns
 *   Human-readable list.
 */
export function formatList(items: Array<string>, locale: Locale): string {
  return new Intl.ListFormat(locale, { type: 'conjunction' }).format(items)
}
