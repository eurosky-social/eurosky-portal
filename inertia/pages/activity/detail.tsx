import { ArrowUturnLeftIcon, ChevronLeftIcon, LanguageIcon } from '@heroicons/react/20/solid'
import { Head } from '@inertiajs/react'
import type { ReactNode } from 'react'
import type { BskyAppPost, BskyAppProfile } from '#services/bsky_app_service'
import type { ActivityDetail } from '#transformers/activity_transformer'
import { Embed } from '~/components/Embed'
import { OpenWith } from '~/components/OpenWith'
import { RichText } from '~/components/RichText'
import { SiteStandardDocument } from '~/components/SiteStandardDocument'
import { Avatar } from '~/lib/avatar'
import Card from '~/lib/card'
import { BackLink } from '~/lib/link'
import type { InertiaProps } from '~/types'

export default function ActivityDetailPage({
  activity,
  post,
  profile,
}: InertiaProps<{
  activity: ActivityDetail
  post?: BskyAppPost | undefined
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
        <div className="flex items-start gap-3">
          {post?.author ? (
            <Avatar
              className="size-10 shrink-0 bg-amber-100 text-amber-700"
              src={post.author.avatar}
            />
          ) : undefined}
          <div>
            <p className="text-sm text-zinc-900 dark:text-white">
              You liked a post by <UserName user={post?.author} />
            </p>
            {post?.text ? (
              <p className="mt-1 text-sm whitespace-pre-wrap text-zinc-500 dark:text-zinc-400">
                {post.text}
              </p>
            ) : undefined}
          </div>
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
    case 'app.bsky.graph.follow':
      actions = <OpenWith uri={activity.openUri} />
      detail = (
        <div className="flex items-center gap-3">
          {profile ? (
            <Avatar className="size-10 shrink-0 bg-amber-100 text-amber-700" src={profile.avatar} />
          ) : undefined}
          <p className="text-sm text-zinc-900 dark:text-white">
            You followed <UserName user={profile} />
          </p>
        </div>
      )
      title = 'Follow'
      break
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
      detail = <SiteStandardDocument activity={activity} />
      title = 'Article'
      break
    default:
      throw new Error(`Unsupported activity type: ${$type}`)
  }

  return (
    <Card className="p-6 sm:p-8">
      <Head title={title} />

      <div className="mb-8 flex items-start justify-between gap-4">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 dark:text-zinc-400">
          <BackLink className="hover:text-zinc-700 dark:hover:text-zinc-300" route="activity.show">
            <ChevronLeftIcon aria-hidden="true" className="size-4 inline-block" />
            Your Activity
          </BackLink>
          {' / '}
          <span aria-current="page">{title}</span>
        </nav>
        {actions}
      </div>

      <div className="mt-6 space-y-3">{detail}</div>
    </Card>
  )
}

function UserName({ user }: { user: BskyAppProfile | undefined }): ReactNode {
  const value = user?.displayName || (user?.handle ? '@' + user.handle : undefined) || undefined
  return <span className={value ? 'font-bold' : undefined}>{value || 'someone'}</span>
}
