import { useCallback, useEffect, useState } from 'react'
import * as ThemeUtils from '~/utils/darkmode'
import { type Theme } from '~/utils/darkmode'
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid'

export default function ThemeToggle({}: React.ComponentPropsWithoutRef<'div'>) {
  const [theme, setTheme] = useState<Theme>(ThemeUtils.getTheme())

  useEffect(() => {
    ThemeUtils.setTheme(theme)
    // On page load or when changing themes, best to add inline in `head` to avoid FOUC
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    console.log(theme)
    const newTheme = theme === 'dark' ? 'light' : 'dark'

    ThemeUtils.setTheme(theme)
    setTheme(newTheme)
  }, [theme])

  return (
    <div
      className="relative inline-block h-6 w-6 hover:opacity-100 opacity-60"
      onClick={toggleTheme}
    >
      {theme === 'dark' ? (
        <SunIcon title="Set theme to light" />
      ) : (
        <MoonIcon title="Set theme to dark" />
      )}
    </div>
  )
}
