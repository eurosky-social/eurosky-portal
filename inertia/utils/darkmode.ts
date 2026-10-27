/**
 * Theme handling.
 *
 * A chosen theme (`dark`, `light`) is stored in a cookie; the server renders
 * it as `.dark` or `.light` on `html`.
 * With `system` (no cookie), CSS follows the system theme (see the `dark`
 * variant in `app.css`).
 */

import { defaultTheme, isTheme, type Theme, themeColors, themeCookieName } from '#shared/theme'

type Listener = () => undefined | void

/**
 * Theme that is shown (`system` resolved).
 */
export type ShownTheme = Exclude<Theme, 'system'>

const listeners = new Set<Listener>()

const query = '(prefers-color-scheme: dark)'

/**
 * Save a theme and apply it.
 *
 * @param theme
 *   Theme.
 * @returns
 *   Nothing.
 */
export function setTheme(theme: Theme): undefined {
  try {
    document.cookie =
      theme === 'system'
        ? `${themeCookieName}=; path=/; max-age=0; samesite=lax`
        : `${themeCookieName}=${theme}; path=/; max-age=31536000; samesite=lax`
  } catch {}

  const { classList } = document.documentElement
  classList.remove('dark', 'light')
  if (theme !== 'system') classList.add(theme)

  setThemeColor(theme)

  for (const listener of listeners) listener()
}

/**
 * Set browser UI (`<meta name="theme-color">`).
 * See also `inertia_layout.edge`.
 *
 * @param theme
 *   Theme.
 * @returns
 *   Nothing.
 */
function setThemeColor(theme: Theme): undefined {
  for (const meta of document.head.querySelectorAll('meta[name="theme-color"]')) meta.remove()

  const shown: ReadonlyArray<ShownTheme> = theme === 'system' ? ['light', 'dark'] : [theme]

  for (const name of shown) {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = themeColors[name]
    if (theme === 'system') meta.media = `(prefers-color-scheme: ${name})`
    document.head.append(meta)
  }
}

/**
 * Get a client snapshot for `useSyncExternalStore`:
 * the shown theme.
 *
 * @returns
 *   Snapshot.
 */
export function snapshot(): ShownTheme {
  const theme = stored()
  if (theme !== 'system') return theme
  return window.matchMedia(query).matches ? 'dark' : 'light'
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
  const media = window.matchMedia(query)
  listeners.add(listener)
  // CSS follows the system by itself; listeners need to know too.
  media.addEventListener('change', listener)

  return function (): undefined {
    listeners.delete(listener)
    media.removeEventListener('change', listener)
  }
}

/**
 * Get the stored theme.
 *
 * @returns
 *   Theme.
 */
function stored(): Theme {
  try {
    for (const entry of document.cookie.split('; ')) {
      const [key, value] = entry.split('=')
      if (key === themeCookieName && isTheme(value)) return value
    }
  } catch {}

  return defaultTheme
}
