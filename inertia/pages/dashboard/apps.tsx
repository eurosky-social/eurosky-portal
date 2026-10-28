import { useMemo } from 'react'
import { Data } from '@generated/data'
import { ShieldCheckIcon } from '@heroicons/react/24/solid'
import { Head, usePage } from '@inertiajs/react'
import { AppGrid } from '~/components/AppGrid'
import { Button } from '~/lib/button'
import Card from '~/lib/card'
import { Text } from '~/lib/text'
import type { InertiaProps } from '~/types'
import { useAuth } from '~/utils/use_auth'
import { NewTab } from '~/components/NewTab'
import { PageHeader } from '~/components/PageHeader'
import { useT } from '~/lib/i18n'

export default function YourApps({
  apps,
  favorites,
}: InertiaProps<{
  apps: Data.AppSummary[]
  favorites: Array<string>
}>) {
  const {
    props: { authorizationServer },
  } = usePage()
  const user = useAuth()
  const { t, tPlain } = useT()

  const manageAppsUrl = useMemo(() => {
    return new URL(
      '/account/u/' + encodeURIComponent(user.did) + '/apps',
      authorizationServer
    ).toString()
  }, [authorizationServer, user.did])

  return (
    <div className="flex flex-col gap-y-6">
      <Head title={tPlain('sidebar.yourApps')} />
      <PageHeader description={t('yourApps.subheading')} title={t('sidebar.yourApps')} />

      {apps.length === 0 ? (
        <Card className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Text>{t('yourApps.empty')}</Text>
          <Button route="discover.apps" className="w-full sm:w-auto">
            {t('yourApps.browse')}
          </Button>
        </Card>
      ) : (
        <AppGrid apps={apps} favorites={favorites} />
      )}

      <Card className="p-4 flex flex-row gap-3">
        <ShieldCheckIcon
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-neutral-500 dark:text-neutral-400"
        />
        <div>
          <h2 className="text-base/6 font-semibold text-neutral-950 sm:text-sm/6 dark:text-white">
            {t('yourApps.access.heading')}
          </h2>
          <Text>{t('yourApps.access.text')}</Text>
          <Text>
            <a
              className="font-semibold text-neutral-950 underline dark:text-white"
              href={manageAppsUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t('yourApps.access.link')}
              <NewTab />
            </a>
          </Text>
        </div>
      </Card>
    </div>
  )
}
