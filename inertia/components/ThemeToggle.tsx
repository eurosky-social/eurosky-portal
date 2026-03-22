import { useCallback, useEffect, useState } from 'react'
import * as ThemeUtils from '~/utils/darkmode'
import { type Theme } from '~/utils/darkmode'
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid'
import { Button } from '~/lib/button'

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
    <Button className="relative inline-block s-8 p-2" plain onClick={toggleTheme}>
      {theme === 'dark' ? (
        <SunIcon title="Set theme to light" />
      ) : (
        <MoonIcon title="Set theme to dark" />
      )}
    </Button>
  )
}
