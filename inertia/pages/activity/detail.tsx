import { ChevronLeftIcon } from '@heroicons/react/20/solid'
import { Head } from '@inertiajs/react'
import type { ActivityDetail } from '#transformers/activity_transformer'
import { RichText } from '~/components/RichText'
import Card from '~/lib/card'
import { Link } from '~/lib/link'
import { Text } from '~/lib/text'
import type { InertiaProps } from '~/types'

export default function ActivityDetailPage({
  activity,
}: InertiaProps<{
  activity: ActivityDetail
}>) {
  let title: string
  let detail = <></>

  const { $type } = activity

  switch ($type) {
    case 'app.bsky.feed.like':
      detail = (
        <Text>
          Liked <span className="font-mono text-xs break-all">{activity.subject.uri}</span>
        </Text>
      )
      title = 'Like'
      break
    case 'app.bsky.feed.post':
      detail = <RichText text={activity.text} />
      title = 'Post'
      break
    case 'app.bsky.graph.follow':
      detail = (
        <Text>
          Followed <span className="font-mono text-xs break-all">{activity.subject}</span>
        </Text>
      )
      title = 'Follow'
      break
    case 'id.sifa.profile.language':
      title = activity.name
      break
    case 'site.standard.document':
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

      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        <Link className="hover:text-zinc-700 dark:hover:text-zinc-300" route="activity.show">
          <ChevronLeftIcon aria-hidden="true" className="size-4 inline-block" />
          Your Activity
        </Link>
        {' / '}
        <span aria-current="page">{title}</span>
      </nav>

      <div className="mt-6 space-y-3">{detail}</div>
    </Card>
  )
}
