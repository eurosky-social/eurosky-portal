import {
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  HeartIcon,
  LanguageIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'
import type { ActivityRow } from '#services/activity_service'
import type { SupportedCollection } from '#utils/activity'
import { Link } from '~/lib/link'

type Component = typeof HeartIcon

const icons = {
  'app.bsky.feed.like': HeartIcon,
  'app.bsky.feed.post': ChatBubbleLeftIcon,
  'app.bsky.graph.follow': UserPlusIcon,
  'id.sifa.profile.language': LanguageIcon,
  'site.standard.document': DocumentTextIcon,
} satisfies Record<SupportedCollection, Component>

export function ActivityItem({ activity }: { activity: ActivityRow }) {
  const { collection, createdAt, text, uri } = activity
  const Icon = icons[collection]
  const createdAtDisplay = formatDate(createdAt)
  const rkey = uri.split('/').pop() ?? ''

  return (
    <li>
      <Link
        className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        route="activity.detail"
        routeParams={{ collection, rkey }}
      >
        <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
        <span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-white">
          {text}
        </span>
        <span className="shrink-0 whitespace-nowrap break-all text-xs text-gray-600 dark:text-gray-400 font-mono">
          {collection}
        </span>
        {createdAtDisplay && (
          <span className="shrink-0 whitespace-nowrap break-all text-sm text-gray-600 dark:text-gray-400">
            {createdAtDisplay}
          </span>
        )}
      </Link>
    </li>
  )
}

/**
 * @param value
 *   ISO 8601 date string.
 * @returns
 *   Human-readable date.
 */
function formatDate(value: string | null | undefined): string | undefined {
  if (!value) return
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return
  return date.toLocaleString(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
