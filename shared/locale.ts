/**
 * BCP 47 language tag.
 */
export type Locale = (typeof locales)[number]

/**
 * Default locale.
 */
export const defaultLocale: Locale = 'en'

/**
 * Supported BCP 47 language names to their human readable names,
 * in their respective languages.
 */
export const localeNames = {
  en: 'English',
  nl: 'Nederlands',
} satisfies Record<Locale, string>

/**
 * List of supported locales.
 */
export const locales = ['en', 'nl'] as const

/**
 * Check if something is a known locale.
 *
 * @param value
 *   Value to check.
 * @returns
 *   Whether the value is a known locale.
 */
export function isLocale(value: unknown): value is Locale {
  return (locales as ReadonlyArray<unknown>).includes(value)
}
