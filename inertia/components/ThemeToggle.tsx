import { usePage } from '@inertiajs/react'
import { useSyncExternalStore } from 'react'
import { setTheme, snapshot, subscribe } from '~/utils/darkmode'
import { LightBulbIcon, MoonIcon } from '@heroicons/react/24/solid'
import { Button } from '~/lib/button'
import { useT } from '~/lib/i18n'

export function ThemeToggle({ className }: React.ComponentPropsWithoutRef<'div'>) {
  // On the server (and while hydrating), `system` cannot be resolved.
  const chosen = usePage().props.theme
  const theme = useSyncExternalStore(subscribe, snapshot, () =>
    chosen === 'system' ? undefined : chosen
  )
  const { tPlain } = useT()
  const label = tPlain(theme === 'dark' ? 'theme.setLight' : 'theme.setDark')

  return (
    <Button
      aria-label={label}
      className={className}
      icon
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      title={label}
    >
      <MoonIcon className="dark:hidden" data-slot="icon" />
      <LightBulbIcon className="hidden dark:block" data-slot="icon" />
    </Button>
  )
}
