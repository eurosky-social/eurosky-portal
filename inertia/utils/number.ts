import type { Locale } from '#shared/locale'

/**
 * Format a number for display.
 *
 * @param value
 *   Number to format.
 * @param locale
 *   Locale to format with.
 * @returns
 *   Human-readable number.
 */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(value)
}
