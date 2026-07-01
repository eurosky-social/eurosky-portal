import { useEffect } from 'react'
import { router } from '@inertiajs/react'
import type { GetRecordsResult } from '#services/activity_service'
import { urlFor } from '~/client'
import { ActivityList } from '~/components/ActivityList'
import { Button } from '~/lib/button'
import type { InertiaProps } from '~/types'

const pageSize = 20

export default function Activity(result: InertiaProps<GetRecordsResult>) {
  useEffect(() => {
    if (result.state !== 'syncing') return
    const timeout = setTimeout(() => router.reload(), 5_000)
    return () => clearTimeout(timeout)
  }, [result.state])

  return (
    <div className="flex flex-col gap-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Activity</h1>
        <p aria-live="polite" className="mt-1 text-gray-500 dark:text-gray-400" role="status">
          {result.state === 'syncing'
            ? 'Syncing your activity, this may take a moment…'
            : `Showing ${result.activities.length} of ${result.total} ${result.total === 1 ? 'activity' : 'activities'}.`}
        </p>
      </div>

      {result.state === 'syncing' ? null : result.activities.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No records found.</p>
      ) : (
        <>
          <ActivityList activities={result.activities} />
          <div className="flex justify-center">
            <Button disabled={result.activities.length >= result.total} onClick={more} outline>
              Load more
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
