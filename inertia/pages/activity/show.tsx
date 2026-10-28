import { links } from '#shared/links'
import { useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import { TriangleAlert } from 'lucide-react'
import type { GetRecordsResult } from '#services/activity_service'
import { urlFor } from '~/client'
import { ActivityList } from '~/components/ActivityList'
import { PageHeader } from '~/components/PageHeader'
import { Button } from '~/lib/button'
import Card from '~/lib/card'
import { Text } from '~/lib/text'
import type { InertiaProps } from '~/types'
import { NewTab } from '~/components/NewTab'
import { useT } from '~/lib/i18n'

const pageSize = 20

export default function Activity(result: InertiaProps<GetRecordsResult>) {
  const { t, tPlain } = useT()

  useEffect(() => {
    if (result.state !== 'syncing') return
    const timeout = setTimeout(() => router.reload(), 5_000)
    return () => clearTimeout(timeout)
  }, [result.state])

  return (
    <div className="flex flex-col gap-y-6">
      <Head title={tPlain('sidebar.yourActivity')} />
      <PageHeader
        description={
          result.state === 'syncing'
            ? t('dashboard.activity.syncing')
            : t('activity.showing', { count: result.activities.length, total: result.total })
        }
        live
        title={t('sidebar.yourActivity')}
      />

      <Card className="p-4 bg-amber-50! dark:bg-amber-400/10! flex flex-row gap-3">
        <TriangleAlert aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-amber-400" />
        <div>
          <Text className="font-semibold text-amber-800! dark:text-amber-200!">
            {t('activity.underConstruction.title')}
          </Text>
          <Text className="text-amber-700! dark:text-amber-200/80!">
            {t('activity.underConstruction.text')}
          </Text>
          <Text className="text-amber-700! dark:text-amber-200/80!">
            <a
              className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-100"
              href={links.feedback}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t('beta.giveFeedback')}
              <NewTab />
            </a>
          </Text>
        </div>
      </Card>

      {result.state === 'syncing' ? null : result.activities.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">{t('activity.noRecords')}</p>
      ) : (
        <>
          <ActivityList activities={result.activities} />
          <div className="flex justify-center">
            <Button disabled={result.activities.length >= result.total} onClick={more} outline>
              {t('activity.loadMore')}
            </Button>
          </div>
        </>
      )}
    </div>
  )

  function more() {
    if (result.state !== 'ready') return
    router.get(
      urlFor('activity.show'),
      { limit: result.activities.length + pageSize, snapshot: result.snapshot },
      { only: ['activities'], preserveScroll: true, preserveState: true }
    )
  }
}
