export const themes = ['system', 'dark', 'light'] as const
export type Theme = (typeof themes)[number]

export function isSystemTheme() {
  const stored = localStorage.getItem('theme')
  return !stored || stored === 'system'
}

export function prefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function getTheme(): Theme {
  const stored = localStorage.getItem('theme')
  const theme = themes.find((d) => d === stored) ?? 'system'

  if (theme !== stored) localStorage.setItem('theme', theme)

  if (theme === 'system') {
    return prefersDark() ? 'dark' : 'light'
  }

  return theme
}

export function setTheme(theme: Theme) {
  if (theme === 'system') {
    localStorage.removeItem('theme')
    document.documentElement.classList.toggle('dark', prefersDark())
  } else {
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
}

// Listen for system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (isSystemTheme()) {
    document.documentElement.classList.toggle('dark', e.matches)
  }
})
