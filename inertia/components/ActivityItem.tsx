import clsx from 'clsx'
import { Heart, LucideIcon, MessageSquareText, Newspaper, UserPlus, Languages } from 'lucide-react'
import type { ActivityRow } from '#services/activity_service'
import type { SupportedCollection } from '#utils/activity'
import { ClickableCard } from '~/lib/card'
import { Link } from '~/lib/link'
import { formatDate } from '~/utils/date'

const icons = {
  'app.bsky.feed.like': Heart,
  'app.bsky.feed.post': MessageSquareText,
  'app.bsky.graph.follow': UserPlus,
  'id.sifa.profile.language': Languages,
  'site.standard.document': Newspaper,
} satisfies Record<SupportedCollection, LucideIcon>

const labels = {
  'app.bsky.feed.like': 'Like',
  'app.bsky.feed.post': 'Post',
  'app.bsky.graph.follow': 'Follow',
  'id.sifa.profile.language': 'Language',
  'site.standard.document': 'Article',
} satisfies Record<SupportedCollection, string>

export function ActivityItem({ activity }: { activity: ActivityRow }) {
  const { collection, createdAt, text, uri } = activity
  const Icon = icons[collection]
  const label = labels[collection]
  const createdAtDisplay = formatDate(createdAt)
  const rkey = uri.split('/').pop() ?? ''

  return (
    <li>
      <ClickableCard
        as={Link}
        className="block w-full p-4"
        route="activity.detail"
        routeParams={{ collection, rkey }}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-2 py-1 text-sm font-medium dark:border-zinc-600">
            <Icon aria-hidden="true" className="h-4 w-4" />
            {label}
          </span>
          {createdAtDisplay ? (
            <>
              <span className="text-sm">Created on {createdAtDisplay}</span>
            </>
          ) : undefined}
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
