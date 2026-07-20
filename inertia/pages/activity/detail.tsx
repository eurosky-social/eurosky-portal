import {
  ArrowUturnLeftIcon,
  ChevronLeftIcon,
  HeartIcon,
  LanguageIcon,
} from '@heroicons/react/20/solid'
import { Head } from '@inertiajs/react'
import type { ReactNode } from 'react'
import type { BskyAppProfile } from '#services/bsky_app_service'
import type { ActivityDetail } from '#transformers/activity_transformer'
import { Embed } from '~/components/Embed'
import { OpenWith } from '~/components/OpenWith'
import { RichText } from '~/components/RichText'
import { Avatar } from '~/lib/avatar'
import Card from '~/lib/card'
import { Link } from '~/lib/link'
import { Text } from '~/lib/text'
import type { InertiaProps } from '~/types'

export default function ActivityDetailPage({
  activity,
  profile,
}: InertiaProps<{
  activity: ActivityDetail
  profile?: BskyAppProfile | undefined
}>) {
  let actions: ReactNode
  let detail: ReactNode
  let title: string

  const { $type } = activity

  switch ($type) {
    case 'app.bsky.feed.like':
      actions = <OpenWith uri={activity.openUri} />
      detail = (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-300 p-4 text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          <HeartIcon aria-hidden="true" className="size-3.5 shrink-0" />
          <p className="text-sm">Liked something</p>
        </div>
      )
      title = 'Like'
      break
    case 'app.bsky.feed.post':
      actions = <OpenWith uri={activity.openUri} />
      detail = (
        <>
          {activity.replyUri ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
              <ArrowUturnLeftIcon aria-hidden="true" className="size-3.5 shrink-0" />
              Replying to a post
            </div>
          ) : undefined}
          <RichText text={activity.text} />
          {activity.embed ? <Embed embed={activity.embed} /> : undefined}
        </>
      )
      title = 'Post'
      break
    case 'app.bsky.graph.follow': {
      const name = profile
        ? profile.displayName || (profile.handle ? '@' + profile.handle : undefined)
        : undefined
      actions = <OpenWith uri={activity.openUri} />
      detail = (
        <div className="flex items-center gap-3">
          {profile ? (
            <Avatar className="size-10 shrink-0 bg-amber-100 text-amber-700" src={profile.avatar} />
          ) : undefined}
          <p className="text-sm text-zinc-900 dark:text-white">
            You followed <span className={name ? 'font-bold' : undefined}>{name || 'someone'}</span>
          </p>
        </div>
      )
      title = 'Follow'
      break
    }
    case 'id.sifa.profile.language':
      detail = (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-300 p-4 text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          <LanguageIcon aria-hidden="true" className="size-3.5 shrink-0" />
          <p className="text-sm">Added {activity.name}</p>
        </div>
      )
      title = 'Language'
      break
    case 'site.standard.document':
      actions = <OpenWith uri={activity.openUri} />
      detail = (
        <>
          {activity.description ? (
            <p className="text-base text-zinc-700 dark:text-zinc-300">{activity.description}</p>
          ) : undefined}
          {activity.tags && activity.tags.length > 0 ? (
            <Text>Tags: {activity.tags.join(', ')}</Text>
          ) : undefined}
          <Text className="font-mono text-xs break-all">{activity.site}</Text>
        </>
      )
      title = activity.title
      break
    default:
      throw new Error(`Unsupported activity type: ${$type}`)
  }

  return (
    <Card className="p-6 sm:p-8">
      <Head title={title} />

      <div className="mb-8 flex items-start justify-between gap-4">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 dark:text-zinc-400">
          <Link className="hover:text-zinc-700 dark:hover:text-zinc-300" route="activity.show">
            <ChevronLeftIcon aria-hidden="true" className="size-4 inline-block" />
            Your Activity
          </Link>
          {' / '}
          <span aria-current="page">{title}</span>
        </nav>
        {actions}
      </div>

      <div className="mt-6 space-y-3">{detail}</div>
    </Card>
  )
}
