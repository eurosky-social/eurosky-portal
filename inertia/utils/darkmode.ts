export const themes = ['system', 'dark', 'light'] as const
export type Theme = (typeof themes)[number]

export function isSystemTheme() {
  return !localStorage.getItem('theme') || localStorage.theme === 'system'
}

export function prefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function getTheme(): Theme {
  let theme = localStorage.theme

  if (!themes.includes(theme)) {
    localStorage.theme = 'system'
    theme = 'system'
  }

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
  if (!localStorage.getItem('theme') || localStorage.theme === 'system') {
    document.documentElement.classList.toggle('dark', e.matches)
  }
})
