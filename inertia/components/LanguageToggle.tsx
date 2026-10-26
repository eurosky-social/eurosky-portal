import { CheckIcon } from '@heroicons/react/16/solid'
import { LanguageIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { localeNames, locales } from '#shared/locale'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '~/lib/dropdown'
import { useT } from '~/lib/i18n'

export function LanguageToggle({ className }: React.ComponentPropsWithoutRef<'div'>) {
  const { locale, setLocale, tPlain } = useT()

  return (
    <Dropdown>
      <DropdownButton
        aria-label={tPlain('nav.chooseLanguage')}
        className={clsx(className, 'relative inline-flex! w-10 h-10 p-0.5!')}
        plain
        title={tPlain('nav.chooseLanguage')}
      >
        <LanguageIcon className="text-neutral-500! dark:text-slate-400!" />
      </DropdownButton>
      <DropdownMenu anchor="bottom end">
        {locales.map((code) => (
          <DropdownItem
            aria-current={code === locale ? 'true' : undefined}
            key={code}
            onClick={() => setLocale(code)}
          >
            <span className="col-span-full flex w-full items-center justify-between gap-2">
              <span lang={code}>{localeNames[code]}</span>
              {code === locale ? (
                <CheckIcon aria-hidden="true" className="size-4 shrink-0" />
              ) : undefined}
            </span>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}
