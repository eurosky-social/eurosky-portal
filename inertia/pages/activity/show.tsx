import { Head, router } from '@inertiajs/react'
import type { GetRecordsResult } from '#services/activity_service'
import { urlFor } from '~/client'
import { ActivityList } from '~/components/ActivityList'
import { PageHeader } from '~/components/PageHeader'
import { UnderConstruction } from '~/components/UnderConstruction'
import { Button } from '~/lib/button'
import type { InertiaProps } from '~/types'
import { useT } from '~/lib/i18n'
import { usePoll } from '~/utils/use_poll'

const pageSize = 20

export default function Activity(result: InertiaProps<GetRecordsResult>) {
  const { t, tPlain } = useT()

  usePoll(result.state === 'syncing')

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

      <UnderConstruction>{t('activity.underConstruction.text')}</UnderConstruction>

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
