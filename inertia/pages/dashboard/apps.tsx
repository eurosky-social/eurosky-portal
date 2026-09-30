import { useMemo } from 'react'
import { Data } from '@generated/data'
import { ArrowTopRightOnSquareIcon, ShieldCheckIcon } from '@heroicons/react/24/solid'
import { Head, usePage } from '@inertiajs/react'
import { AppGrid } from '~/components/AppGrid'
import { Button } from '~/lib/button'
import Card from '~/lib/card'
import { Text } from '~/lib/text'
import type { InertiaProps } from '~/types'
import { useAuth } from '~/utils/use_auth'
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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t('sidebar.yourApps')}
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">{t('yourApps.subheading')}</p>
      </div>

      {apps.length === 0 ? (
        <Card className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Text>{t('yourApps.empty')}</Text>
          <Button route="discover.apps" className="w-full sm:w-auto dark:bg-slate-700!">
            {t('yourApps.browse')}
          </Button>
        </Card>
      ) : (
        <AppGrid apps={apps} favorites={favorites} />
      )}

      <Card className="p-4 flex flex-row gap-3">
        <ShieldCheckIcon aria-hidden="true" className="mt-1 size-5 shrink-0 text-slate-400" />
        <div>
          <Text className="font-semibold">{t('yourApps.access.heading')}</Text>
          <Text>{t('yourApps.access.text')}</Text>
          <Text>
            <a
              className="inline-flex items-center gap-1 font-semibold underline"
              href={manageAppsUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t('yourApps.access.link')}
              <ArrowTopRightOnSquareIcon aria-hidden="true" className="size-4" />
            </a>
          </Text>
        </div>
      </Card>
    </div>
  )
}
