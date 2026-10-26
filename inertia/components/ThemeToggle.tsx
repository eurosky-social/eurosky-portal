import { useCallback, useEffect, useState } from 'react'
import * as ThemeUtils from '~/utils/darkmode'
import { type Theme } from '~/utils/darkmode'
import { LightBulbIcon, MoonIcon } from '@heroicons/react/24/solid'
import { Button } from '~/lib/button'
import clsx from 'clsx'
import { useT } from '~/lib/i18n'

export function ThemeToggle({ className }: React.ComponentPropsWithoutRef<'div'>) {
  const [theme, setTheme] = useState<Theme>(ThemeUtils.getTheme())
  const { tPlain } = useT()

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

  const label = tPlain(theme === 'dark' ? 'theme.setLight' : 'theme.setDark')

  return (
    <Button
      aria-label={label}
      className={clsx(className, 'relative inline-block w-10 h-10 p-0.5!')}
      plain
      onClick={toggleTheme}
      title={label}
    >
      {theme === 'dark' ? (
        <LightBulbIcon className="dark:text-slate-400!" />
      ) : (
        <MoonIcon className="text-neutral-500!" />
      )}
    </Button>
  )
}
