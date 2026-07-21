import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import type { Root } from 'hast'
import { micromark } from 'micromark'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { useMemo } from 'react'
import type { SiteStandardDocumentDetail } from '#transformers/activity_transformer'
import { BlobImage } from '~/components/BlobImage'
import { Text } from '~/lib/text'
import { formatDate } from '~/utils/date'
import * as components from './RichTextComponents'

export function SiteStandardDocument({ activity }: { activity: SiteStandardDocumentDetail }) {
  // Cast because inertia fails on TS `interface`s.
  const content = activity.content as Root | undefined
  const publishedAtDisplay = formatDate(activity.publishedAt)
  const updatedAtDisplay = formatDate(activity.updatedAt)
  // Assume fallback text is markdown, seems to work well with Offprint.
  const textContentHtml = useMemo(
    () => (!activity.content && activity.textContent ? micromark(activity.textContent) : undefined),
    [activity.content, activity.textContent]
  )
  return (
    <>
      {activity.coverImage ? (
        <BlobImage
          alt=""
          blob={activity.coverImage}
          className="aspect-video w-full rounded-lg object-cover"
        />
      ) : undefined}
      <h1 className="text-center text-3xl font-semibold text-zinc-950 sm:text-4xl dark:text-white">
        {activity.title}
      </h1>
      {activity.description ? (
        <p className="text-center text-lg text-zinc-500 dark:text-zinc-400">
          {activity.description}
        </p>
      ) : undefined}
      {content ? (
        <div className="article-body markdown-document text-zinc-900 dark:text-white">
          {toJsxRuntime(content, {
            Fragment,
            components,
            jsxs,
            jsx,
            passNode: true,
          })}
        </div>
      ) : textContentHtml ? (
        <div
          className="article-body markdown-document text-zinc-900 dark:text-white"
          dangerouslySetInnerHTML={{ __html: textContentHtml }}
        />
      ) : undefined}
      {activity.tags && activity.tags.length > 0 ? (
        <Text>Tags: {activity.tags.join(', ')}</Text>
      ) : undefined}
      {activity.contributors && activity.contributors.length > 0 ? (
        <Text>
          By{' '}
          {activity.contributors
            .map((contributor) => {
              const name = contributor.displayName ?? contributor.did
              return contributor.role ? `${name} (${contributor.role})` : name
            })
            .join(', ')}
        </Text>
      ) : undefined}
      {publishedAtDisplay ? <Text>Published: {publishedAtDisplay}</Text> : undefined}
      {updatedAtDisplay ? <Text>Updated: {updatedAtDisplay}</Text> : undefined}
    </>
  )
}
