import type { Locale } from '#shared/locale'

/**
 * Parse a date string.
 *
 * @param value
 *   Date string.
 * @returns
 *   Parsed date if valid.
 */
export function parseDate(value: string | null | undefined): Date | undefined {
  if (!value) return
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return
  return date
}

/**
 * Format a date for display.
 *
 * @param date
 *   Date to format.
 * @param locale
 *   Locale to format with.
 * @returns
 *   Human-readable date.
 */
export function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
}
