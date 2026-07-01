import { CubeIcon } from '@heroicons/react/24/outline'
import type { Activity } from '#services/activity_service'

export function ActivityItem({ activity }: { activity: Activity }) {
  const createdAtDisplay = formatDate(activity.createdAt)
  return (
    <li className="flex items-center gap-4 px-4 py-4">
      <CubeIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
      <span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-white">
        {activity.text}
      </span>
      <span className="shrink-0 whitespace-nowrap break-all text-xs text-gray-600 dark:text-gray-400 font-mono">
        {activity.collection}
      </span>
      {createdAtDisplay && (
        <span className="shrink-0 whitespace-nowrap break-all text-sm text-gray-600 dark:text-gray-400">
          {createdAtDisplay}
        </span>
      )}
    </li>
  )
}

function formatDate(value: string | null | undefined): string | undefined {
  if (!value) return
  const date = new Date(value)
  if (isNaN(date.getTime())) return
  return date.toLocaleString(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
