import type { AtUriString } from '@atproto/lex'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import { useSyncExternalStore } from 'react'
import { TouchTarget, styles as buttonStyles } from '~/lib/button'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '~/lib/dropdown'
import { find, preferred, prefer, serverSnapshot, snapshot, subscribe } from '~/utils/apps'
import { useT } from '~/lib/i18n'

interface Properties {
  uri: AtUriString
}

export function OpenWith({ uri }: Properties) {
  const { t } = useT()
  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const choices = find(uri)
  const choice = preferred(choices, value)

  if (!choice) return

  const [preferredName, preferredUrl] = choice

  return (
    <span className="inline-flex">
      <a
        className={clsx(
          buttonStyles.base,
          buttonStyles.outline,
          '-mr-px rounded-r-none pr-3.5 sm:pr-3'
        )}
        href={preferredUrl}
        rel="noreferrer"
        target="_blank"
      >
        <TouchTarget>{t('apps.openWith', { name: preferredName })}</TouchTarget>
      </a>
      <Dropdown>
        <DropdownButton className="rounded-l-none px-2 sm:px-1.5" outline>
          <ChevronDownIcon aria-hidden="true" className="size-4" />
          <span className="sr-only">{t('apps.chooseAppToOpen')}</span>
        </DropdownButton>
        <DropdownMenu anchor="bottom end">
          {choices.map(([name]) => (
            <DropdownItem
              key={name}
              onClick={() => {
                prefer(name, value)
              }}
            >
              <span className="col-span-full flex w-full items-center justify-between gap-2">
                {name}
                {name === preferredName ? (
                  <CheckIcon aria-hidden="true" className="size-4 shrink-0" />
                ) : undefined}
              </span>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </span>
  )
}
