import { useCallback, useEffect } from 'react'
import { Head, router as inertiaRouter } from '@inertiajs/react'
import type { ActivityRow, GetRecordsResult } from '#services/activity_service'
import { ActivityList } from '~/components/ActivityList'
import { UserAvatar } from '~/components/UserAvatar'
import { Button } from '~/lib/button'
import Card from '~/lib/card'
import { Text } from '~/lib/text'
import { InertiaProps } from '~/types'
import { useAuth } from '~/utils/use_auth'
import { Data } from '@generated/data'
import { AppGrid } from '~/components/AppGrid'
import { client } from '~/client'
import { useRouter } from '@adonisjs/inertia/react'
import { INVALID_HANDLE } from '@atproto/syntax'
import { links } from '#shared/links'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { NewTab } from '~/components/NewTab'
import { useT } from '~/lib/i18n'
import { formatNumber } from '~/utils/number'

export default function Dashboard({
  activities,
  activityState,
  apps,
  appsKind,
  favorites,
  profile,
  showWelcomeMessage,
}: InertiaProps<{
  activities: ActivityRow[]
  activityState: GetRecordsResult['state']
  apps: Data.AppSummary[]
  appsKind: 'featured' | 'yours'
  favorites: Array<string>
  profile: Data.Profile | undefined
  showWelcomeMessage: boolean
}>) {
  const user = useAuth()
  const router = useRouter()
  const { locale, t, tPlain } = useT()
  const isHandleInvalid = user.handle === INVALID_HANDLE

  const dismissWelcome = useCallback(async () => {
    await client.api.account.dismissWelcome({})
    router.visit({ route: 'dashboard.show' }, { only: ['showWelcomeMessage'] })
  }, [])

  useEffect(() => {
    if (activityState !== 'syncing') return
    const timeout = setTimeout(() => {
      inertiaRouter.reload({ only: ['activities', 'activityState'] })
    }, 5_000)
    return () => clearTimeout(timeout)
  }, [activityState])

  return (
    <div className="flex flex-col gap-y-8">
      <Head title={tPlain('sidebar.dashboard')} />
      <h1 className="sr-only">{t('sidebar.dashboard')}</h1>
      {isHandleInvalid && (
        <Card className="p-4 bg-amber-50! dark:bg-amber-400/10! flex flex-row gap-3">
          <ExclamationTriangleIcon
            aria-hidden="true"
            className="mt-1 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
          />
          <div>
            <Text className="font-semibold text-amber-800! dark:text-amber-200!">
              {t('dashboard.invalidHandle.title')}
            </Text>
            <Text className="text-amber-700! dark:text-amber-200/80!">
              {t('dashboard.invalidHandle.text', {
                link(chunks) {
                  return (
                    <a
                      className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-100"
                      href={links.helpInvalidHandle(locale)}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {chunks}
                      <NewTab />
                    </a>
                  )
                },
              })}
            </Text>
          </div>
        </Card>
      )}
      {showWelcomeMessage && (
        <Card className="py-3 px-4 flex flex-col grow md:flex-row items-center justify-between gap-x-6 gap-y-4">
          <div className="flex-1">
            <h2 className="text-lg/8 sm:text-xl/8 font-semibold text-neutral-900 dark:text-neutral-200 mb-2">
              {t('dashboard.welcome.heading')}
            </h2>
            <p className="mt-0.5 text-sm/6 text-neutral-500 dark:text-neutral-300">
              {t('dashboard.welcome.text')}
            </p>
            {!isHandleInvalid && (
              <p className="mt-0.5 text-sm/6 text-neutral-500 dark:text-neutral-300">
                {t('dashboard.welcome.handle', {
                  handle: user.handle,
                  strong(chunks) {
                    return (
                      <strong className="font-semibold text-ink dark:text-white whitespace-pre">
                        {chunks}
                      </strong>
                    )
                  },
                })}
              </p>
            )}
          </div>
          <Button onClick={dismissWelcome} outline className="w-full md:w-auto">
            {t('dashboard.welcome.dismiss')}
          </Button>
        </Card>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        <Card className="p-3 md:p-4 col-span-3 md:col-span-2">
          <div className="flex flex-row justify-between">
            <div className="flex flex-row gap-6">
              <div className="size-14 md:size-20 md:self-center">
                <UserAvatar avatar={profile?.avatar} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg/8 font-semibold text-neutral-950 sm:text-2xl/8 dark:text-white">
                  {profile?.displayName
                    ? t('dashboard.greeting.withName', { name: profile.displayName })
                    : t('dashboard.greeting.plain')}
                </h2>
                {isHandleInvalid ? (
                  <Text className="text-amber-700! dark:text-amber-400!">
                    <ExclamationTriangleIcon aria-hidden="true" className="h-5 w-5 inline-block" />{' '}
                    {user.handle}
                  </Text>
                ) : (
                  <Text className="text-neutral-500! dark:text-neutral-400!">@{user.handle}</Text>
                )}
                {profile?.stats && (
                  <div className="hidden md:grid grid-cols-1 sm:grid-cols-3">
                    <div className="pr-4 py-2 sm:col-span-1 flex flex-col-reverse">
                      <StatHeading>{t('dashboard.stats.posts')}</StatHeading>
                      <StatValue>{formatNumber(profile.stats.posts ?? 0, locale)}</StatValue>
                    </div>
                    <div className="px-4 py-2 sm:col-span-1 sm:px-4 flex flex-col-reverse">
                      <StatHeading>{t('dashboard.stats.following')}</StatHeading>
                      <StatValue>{formatNumber(profile.stats.follows ?? 0, locale)}</StatValue>
                    </div>
                    <div className="px-4 py-2 sm:col-span-1 sm:px-4 flex flex-col-reverse">
                      <StatHeading>{t('dashboard.stats.followers')}</StatHeading>
                      <StatValue>{formatNumber(profile.stats.followers ?? 0, locale)}</StatValue>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="py-3 px-4 col-span-3 md:col-span-1">
          <h2 className="text-lg/8 sm:text-xl/8 font-semibold text-neutral-900 dark:text-neutral-200 mb-2">
            {t('dashboard.explore.heading')}
          </h2>
          <p className="text-sm/6 text-neutral-500 dark:text-neutral-300">
            {t('dashboard.explore.text')}
          </p>
          <Button route="explore.learn_more" className="mt-3 w-full sm:w-auto">
            {t('common.learnMore')}
          </Button>
        </Card>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-neutral-950 dark:text-white">
          {t('dashboard.activity.heading')}
        </h2>
        <p className="text-base text-neutral-500 dark:text-neutral-400 mb-6">
          {t('dashboard.activity.subheading')}
        </p>

        {activityState === 'syncing' ? (
          <Card className="p-4">
            <Text aria-live="polite" role="status">
              {t('dashboard.activity.syncing')}
            </Text>
          </Card>
        ) : activities.length === 0 ? (
          <Card className="p-4">
            <Text>{t('dashboard.activity.empty')}</Text>
          </Card>
        ) : (
          <ActivityList activities={activities} />
        )}

        <div className="mt-4 flex justify-center">
          <Button route="activity.show" className="w-full sm:w-auto">
            {t('dashboard.activity.viewAll')}
          </Button>
        </div>
      </div>

      <div className="pt-4">
        <h2 className="text-xl font-semibold text-neutral-950 dark:text-white">
          {t(appsKind === 'yours' ? 'sidebar.yourApps' : 'dashboard.featuredApps.heading')}
        </h2>
        <p className="text-base text-neutral-500 dark:text-neutral-400 mb-6">
          {t(appsKind === 'yours' ? 'dashboard.yourApps.text' : 'dashboard.featuredApps.text')}
        </p>

        <AppGrid apps={apps} favorites={favorites} />

        <div className="mt-1 flex justify-center">
          <Button
            route={appsKind === 'yours' ? 'dashboard.apps' : 'discover.apps'}
            className="w-full sm:w-auto"
          >
            {t(
              appsKind === 'yours'
                ? 'dashboard.yourApps.viewAll'
                : 'dashboard.featuredApps.browseMore'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatHeading({ children }: React.ComponentPropsWithoutRef<'dt'>) {
  return (
    <span className="text-sm/6 font-medium text-neutral-500 dark:text-neutral-400">{children}</span>
  )
}

function StatValue({ children }: React.ComponentPropsWithoutRef<'dd'>) {
  return (
    <div className="mt-1 text-sm/6 font-extrabold sm:mt-2 text-neutral-900 dark:text-white">
      {children}
    </div>
  )
}
