/**
 * Theme: a chosen one or `system` to follow the system theme.
 */
export type Theme = (typeof themes)[number]

/**
 * Default theme.
 */
export const defaultTheme: Theme = 'system'

/**
 * Backgrounds per theme for browser UI.
 */
export const themeColors = { dark: '#0f172b', light: '#ffffff' }

/**
 * Name of the cookie storing a chosen theme (absent for `system`).
 */
export const themeCookieName = 'theme'

/**
 * Supported themes.
 */
export const themes = ['dark', 'light', 'system'] as const

/**
 * Check if something is a known theme.
 *
 * @param value
 *   Value to check.
 * @returns
 *   Whether the value is a known theme.
 */
export function isTheme(value: unknown): value is Theme {
  return (themes as ReadonlyArray<unknown>).includes(value)
}
