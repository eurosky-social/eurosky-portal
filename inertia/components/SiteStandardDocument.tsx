import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import type { Nodes } from 'hast'
import type { SiteStandardDocumentDetail } from '#transformers/activity_transformer'
import { BlobImage } from '~/components/BlobImage'
import { MarkdownContent } from '~/components/MarkdownContent'
import { Text } from '~/lib/text'
import { parseDate } from '~/utils/date'
import { formatList } from '~/utils/list'
import * as components from './RichTextComponents'
import { useT } from '~/lib/i18n'

export function SiteStandardDocument({ activity }: { activity: SiteStandardDocumentDetail }) {
  const { locale, t } = useT()
  // Cast because inertia fails on TS `interface`s.
  const structuredContent = activity.content as Nodes | undefined
  const publishedAt = parseDate(activity.publishedAt)
  const updatedAt = parseDate(activity.updatedAt)

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
      <div className="article-body markdown-document text-zinc-900 dark:text-white">
        {structuredContent ? (
          toJsxRuntime(structuredContent, {
            Fragment,
            components,
            jsxs,
            jsx,
            passNode: true,
          })
        ) : (
          <MarkdownContent value={activity.textContent} />
        )}
      </div>
      {activity.tags && activity.tags.length > 0 ? (
        <Text>{t('activity.article.tags', { tags: formatList(activity.tags, locale) })}</Text>
      ) : undefined}
      {activity.contributors && activity.contributors.length > 0 ? (
        <Text>
          {t('activity.article.by', {
            contributors: formatList(
              activity.contributors.map((contributor) => {
                const name = contributor.displayName ?? contributor.did
                return contributor.role ? `${name} (${contributor.role})` : name
              }),
              locale
            ),
          })}
        </Text>
      ) : undefined}
      {publishedAt ? (
        <Text>{t('activity.article.published', { date: publishedAt })}</Text>
      ) : undefined}
      {updatedAt ? <Text>{t('activity.article.updated', { date: updatedAt })}</Text> : undefined}
    </>
  )
}
