import type { Locale } from '#shared/locale'

/**
 * Format a list of strings for display.
 *
 * @param items
 *   Strings to join.
 * @param locale
 *   Locale to format with.
 * @param options
 *   Configuration (default: `{type: 'conjunction'}`).
 * @returns
 *   Human-readable list.
 */
export function formatList(
  items: Array<string>,
  locale: Locale,
  options?: Intl.ListFormatOptions | null | undefined
): string {
  const settings = options ?? { type: 'conjunction' }
  return new Intl.ListFormat(locale, settings).format(items)
}
