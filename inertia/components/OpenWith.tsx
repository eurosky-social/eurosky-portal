import type { AtUriString } from '@atproto/lex'
import { usePage } from '@inertiajs/react'
import { CheckIcon, ChevronDownIcon, HeartIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import { useSyncExternalStore } from 'react'
import { Avatar } from '~/lib/avatar'
import { TouchTarget, styles as buttonStyles } from '~/lib/button'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '~/lib/dropdown'
import type { LauncherApp } from '#services/atstore_service'
import { find, preferred, prefer, serverSnapshot, snapshot, subscribe } from '~/utils/apps'
import { useT } from '~/lib/i18n'

interface Properties {
  uri: AtUriString
}

export function OpenWith({ uri }: Properties) {
  const { t, tPlain } = useT()
  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const { props } = usePage<{ launcherApps?: Array<LauncherApp> }>()
  const launcherApps = props.launcherApps ?? []
  const favorites = launcherApps.filter((app) => app.favorite).map((app) => app.atUri)
  const choices = find(uri)
  const choice = preferred(choices, value, favorites)

  if (!choice) return

  const [preferredUri, preferredUrl] = choice
  const preferredApp = launcherApps.find((app) => app.atUri === preferredUri)
  const preferredName = preferredApp?.name ?? new URL(preferredUrl).hostname

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
          {choices.map(([appUri, url]) => {
            const app = launcherApps.find((app) => app.atUri === appUri)
            const name = app?.name ?? new URL(url).hostname

            return (
              <DropdownItem
                key={appUri}
                onClick={() => {
                  prefer(appUri, value)
                }}
              >
                <span className="col-span-full flex w-full items-center gap-2">
                  {app ? (
                    <Avatar
                      className="size-5 shrink-0 bg-gray-100 outline-none! dark:bg-gray-800"
                      square
                      src={app.iconUrl}
                    />
                  ) : undefined}
                  <span className="grow" lang="en">
                    {name}
                  </span>
                  {app?.favorite ? (
                    <HeartIcon
                      aria-label={tPlain('apps.favorited')}
                      className="size-4 shrink-0 text-rose-500"
                      role="img"
                    />
                  ) : undefined}
                  <CheckIcon
                    aria-hidden="true"
                    className={clsx('size-4 shrink-0', appUri !== preferredUri && 'invisible')}
                  />
                </span>
              </DropdownItem>
            )
          })}
        </DropdownMenu>
      </Dropdown>
    </span>
  )
}
