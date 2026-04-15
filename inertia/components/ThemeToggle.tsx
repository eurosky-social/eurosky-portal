import { useCallback, useEffect, useState } from 'react'
import * as ThemeUtils from '~/utils/darkmode'
import { type Theme } from '~/utils/darkmode'
import { LightBulbIcon, MoonIcon } from '@heroicons/react/24/solid'
import { Button } from '~/lib/button'
import clsx from 'clsx'

export function ThemeToggle({ className }: React.ComponentPropsWithoutRef<'div'>) {
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
    const newTheme = theme === 'dark' ? 'light' : 'dark'

    ThemeUtils.setTheme(theme)
    setTheme(newTheme)
  }, [theme])

  return (
    <Button
      className={clsx(className, 'relative inline-block w-10 h-10 p-0.5!')}
      plain
      onClick={toggleTheme}
    >
      {theme === 'dark' ? (
        <LightBulbIcon title="Set theme to light" className="dark:text-slate-500!" />
      ) : (
        <MoonIcon title="Set theme to dark" className="text-neutral-400!" />
      )}
    </Button>
  )
}
