import clsx from 'clsx'
import { Heart, LucideIcon, MessageSquareText, Newspaper, UserPlus } from 'lucide-react'
import type { ActivityRow } from '#services/activity_service'
import type { SupportedCollection } from '#utils/activity'
import { ClickableCard } from '~/lib/card'
import { Link } from '~/lib/link'
import { RelativeTime } from '~/lib/relative-time'
import { useT } from '~/lib/i18n'

const icons = {
  'app.bsky.feed.like': Heart,
  'app.bsky.feed.post': MessageSquareText,
  'app.bsky.graph.follow': UserPlus,
  'site.standard.document': Newspaper,
} satisfies Record<SupportedCollection, LucideIcon>

const labelKeys = {
  'app.bsky.feed.like': 'activity.type.like',
  'app.bsky.feed.post': 'activity.type.post',
  'app.bsky.graph.follow': 'activity.type.follow',
  'site.standard.document': 'activity.type.article',
} satisfies Record<SupportedCollection, string>

export function ActivityItem({ activity }: { activity: ActivityRow }) {
  const { collection, createdAt, text, uri } = activity
  const { t } = useT()
  const Icon = icons[collection]
  const label = t(labelKeys[collection])
  const rkey = uri.split('/').pop() ?? ''

  return (
    <li>
      <ClickableCard
        as={Link}
        className="block w-full p-4"
        route="activity.detail"
        routeParams={{ collection, rkey }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-2 py-1 text-sm font-medium dark:border-neutral-600">
            <Icon aria-hidden="true" className="h-4 w-4" />
            {label}
          </span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            <RelativeTime value={createdAt} />
          </span>
        </div>
        {text && (
          <p
            className={clsx('mt-2', {
              'font-bold': collection === 'site.standard.document',
              'text-sm': collection !== 'site.standard.document',
              'text-xl': collection === 'site.standard.document',
            })}
          >
            {text}
          </p>
        )}
      </ClickableCard>
    </li>
  )
}
