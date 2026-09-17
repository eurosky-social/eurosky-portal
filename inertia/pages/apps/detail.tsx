import { Data } from '@generated/data'
import { ChevronLeftIcon } from '@heroicons/react/20/solid'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'
import { Head } from '@inertiajs/react'
import { MarkdownContent } from '~/components/MarkdownContent'
import { Rating } from '~/components/Rating'
import { Avatar } from '~/lib/avatar'
import { Badge } from '~/lib/badge'
import Card from '~/lib/card'
import { Heading } from '~/lib/heading'
import { BackLink } from '~/lib/link'
import { Text } from '~/lib/text'
import { InertiaProps } from '~/types'
import { useT } from '~/lib/i18n'
import { formatNumber } from '~/utils/number'

export default function AppDetailPage({ app }: InertiaProps<{ app: Data.App }>) {
  const { locale, tPlain, t } = useT()
  const { externalUrl, listing, madeInEurope } = app
  const {
    appTags,
    categorySlug,
    description,
    heroImageUrl,
    iconUrl,
    name,
    rating,
    reviewCount,
    tagline,
  } = listing
  const tags = appTags.map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1))
  const categoryPrefix = 'apps/'
  const slug = categorySlug?.startsWith(categoryPrefix)
    ? categorySlug.slice(categoryPrefix.length)
    : undefined
  const reviewsUrl = slug
    ? `https://atstore.fyi/products/${encodeURIComponent(slug)}/reviews`
    : undefined

  return (
    <Card className="p-6 sm:p-8">
      <Head title={name} />

      <nav
        aria-label={tPlain('common.breadcrumb')}
        className="text-sm text-zinc-500 dark:text-zinc-400 mb-8"
      >
        <BackLink className="hover:text-zinc-700 dark:hover:text-zinc-300" route="discover.apps">
          <ChevronLeftIcon aria-hidden="true" className="size-4 inline-block" />
          {t('sidebar.applications')}
        </BackLink>
        {' / '}
        <span aria-current="page" lang="en">
          {name}
        </span>
      </nav>

      <div className="grid gap-8 sm:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar
              className="size-16 shrink-0 bg-gray-100 outline-none! dark:bg-gray-800"
              square
              src={iconUrl}
            />
            <div className="min-w-0">
              <Heading lang="en">{name}</Heading>
              <Text className="mt-1" lang="en">
                {tagline}
              </Text>
            </div>
          </div>

          {madeInEurope || tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {madeInEurope ? <Badge color="blue">{t('apps.madeInEurope')}</Badge> : undefined}
              {tags.map((tag) => (
                <Badge key={tag} lang="en">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : undefined}

          {rating ? (
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-0.5 text-sm text-amber-500">
                <Rating value={parseFloat(rating)} />
                <span className="ml-0.5 text-zinc-400 dark:text-zinc-500">
                  ({formatNumber(reviewCount, locale)})
                </span>
              </span>
              {reviewsUrl ? (
                <a
                  className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                  href={reviewsUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t('apps.detail.seeAllReviews')}
                </a>
              ) : undefined}
            </span>
          ) : undefined}

          <div className="article-body markdown-document text-base/6 text-zinc-500 sm:text-sm/6 dark:text-zinc-400">
            <MarkdownContent value={description} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {externalUrl ? (
              <a
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3.5 py-2.5 text-base/6 font-semibold text-white sm:px-3 sm:py-1.5 sm:text-sm/6 dark:bg-zinc-600"
                href={externalUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t('apps.detail.explore')}
                <ArrowTopRightOnSquareIcon className="ml-1 size-4" />
              </a>
            ) : undefined}
          </div>
        </div>

        {heroImageUrl ? (
          <img
            alt=""
            className="w-full rounded-lg outline outline-black/10 dark:outline-white/10"
            src={heroImageUrl}
          />
        ) : undefined}
      </div>
    </Card>
  )
}
