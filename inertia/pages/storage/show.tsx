import * as Headless from '@headlessui/react'
import { Head, router } from '@inertiajs/react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { type StorageCategory, type StorageTab, storageCategories } from '#shared/storage'
import { urlFor } from '~/client'
import { Badge } from '~/lib/badge'
import { Button } from '~/lib/button'
import Card from '~/lib/card'
import { Heading, Subheading } from '~/lib/heading'
import { useT } from '~/lib/i18n'
import { Text } from '~/lib/text'
import { InertiaProps } from '~/types'
import { formatByteSize } from '~/utils/bytes'
import BlobItem from './BlobItem'

/**
 * Blob metadata exposed by the storage page backend.
 */
export type StorageBlob = {
  /**
   * Category.
   */
  category: StorageCategory

  /**
   * Blob CID.
   */
  cid: string

  /**
   * Blob MIME type when known.
   */
  mimeType?: string | undefined

  /**
   * Size in bytes.
   */
  size: number
}

/**
 * Storage breakdown by category.
 */
type Breakdown = {
  /**
   * Size in bytes.
   */
  bytes: number

  /**
   * Category.
   */
  category: StorageCategory

  /**
   * Files.
   */
  files: number
}

/**
 * Ready.
 * Has to be a `type` for `Inertia`.
 */
type StoragePageReady = {
  /**
   * Blobs for `category`.
   */
  blobs: Array<StorageBlob>

  /**
   * Storage breakdown.
   */
  breakdown: Array<Breakdown>

  /**
   * Tab.
   */
  category: StorageTab

  /**
   * User DID.
   */
  did: string

  /**
   * Whether a further page of `category` can be loaded.
   */
  hasMore: boolean

  /**
   * Pagination cursor.
   */
  snapshot: string | null

  /**
   * Kind.
   */
  state: 'ready'

  /**
   * Total blobs in `category`.
   */
  total: number
}

/**
 * Syncing.
 * Has to be a `type` for `Inertia`.
 */
type StoragePageSyncing = {
  /**
   * User DID.
   */
  did: string

  /**
   * Kind.
   */
  state: 'syncing'
}

/**
 * Properties.
 */
type StoragePageProperties = StoragePageReady | StoragePageSyncing

/**
 * Blobs to load per page.
 * Multiple of `4` so they somewhat fit on a big screen.
 * Matches `defaultLimit` in `app/services/storage_service.ts`.
 */
const blobsPerPage = 48

/**
 * Tabs in display order.
 */
const storageTabs: ReadonlyArray<StorageTab> = ['all', ...storageCategories]

/**
 * Render the storage page.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Element.
 */
export default function StoragePage(properties: InertiaProps<StoragePageProperties>) {
  const { authorizationServer, did, state } = properties
  const { t, tPlain } = useT()

  // This page should only be used for signed in users.
  if (!authorizationServer || !did) {
    throw new Error('Missing required properties')
  }

  useEffect(
    function () {
      if (state !== 'syncing') return

      let cancelled = false

      poll()

      return cancel

      function cancel(): undefined {
        cancelled = true
      }

      function poll(): undefined {
        setTimeout(function () {
          if (cancelled) return
          router.reload({
            onFinish() {
              if (!cancelled) poll()
            },
          })
        }, 5_000)
      }
    },
    [state]
  )

  return (
    <>
      <Head title={tPlain('storage.title')} />
      <div className="space-y-6">
        <div className="space-y-1">
          <Heading level={1}>{t('storage.title')}</Heading>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">{t('storage.subtitle')}</Text>
        </div>
        {state === 'syncing' ? (
          <Card className="p-5 md:p-6">
            <Text aria-live="polite" role="status">
              {t('storage.syncing')}
            </Text>
          </Card>
        ) : (
          <>
            <BlobsSection
              authorizationServer={authorizationServer}
              blobs={properties.blobs}
              breakdown={properties.breakdown}
              category={properties.category}
              did={did}
              hasMore={properties.hasMore}
              snapshot={properties.snapshot}
              total={properties.total}
            />
            <CollectionsSection />
          </>
        )}
      </div>
    </>
  )
}

/**
 * Render the blobs section.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Element.
 */
function BlobsSection(properties: {
  authorizationServer: string
  blobs: ReadonlyArray<StorageBlob>
  breakdown: ReadonlyArray<Breakdown>
  category: StorageTab
  did: string
  hasMore: boolean
  snapshot: string | null
  total: number
}): React.ReactNode {
  const { authorizationServer, blobs, breakdown, category, did, hasMore, snapshot, total } =
    properties
  const { t, tPlain } = useT()

  let totalFiles = 0
  for (const row of breakdown) totalFiles += row.files

  return (
    <>
      <Card className="p-5 md:p-6">
        <StorageBreakdown breakdown={breakdown} />
      </Card>
      <Card className="p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-2">
          <Subheading level={2}>{t('storage.files.heading')}</Subheading>
          <span
            aria-label={tPlain('storage.files.countAria', { count: totalFiles })}
            className="text-sm tabular-nums text-zinc-900 dark:text-zinc-100"
          >
            {t('storage.files.count', { count: totalFiles })}
          </span>
        </div>
        {breakdown.length === 0 ? (
          <Text className="mt-4">{t('storage.files.empty')}</Text>
        ) : (
          <StorageBrowser
            authorizationServer={authorizationServer}
            blobs={blobs}
            breakdown={breakdown}
            category={category}
            did={did}
            hasMore={hasMore}
            snapshot={snapshot}
            total={total}
          />
        )}
      </Card>
    </>
  )
}

/**
 * Render the collections section.
 *
 * @returns
 *   Element.
 */
function CollectionsSection(): React.ReactNode {
  const { t } = useT()

  return (
    <Card className="border border-dashed border-zinc-300 bg-zinc-50 p-5 md:p-6 dark:border-zinc-700 dark:bg-transparent">
      <Subheading level={2}>{t('storage.more.title')}</Subheading>
      <Text className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        {t('storage.more.subtitle')}
      </Text>
    </Card>
  )
}

/**
 * Render the tabbed storage browser for files.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Element.
 */
function StorageBrowser(properties: {
  authorizationServer: string
  blobs: ReadonlyArray<StorageBlob>
  breakdown: ReadonlyArray<Breakdown>
  category: StorageTab
  did: string
  hasMore: boolean
  snapshot: string | null
  total: number
}): React.ReactNode {
  const { authorizationServer, blobs, breakdown, category, did, hasMore, snapshot, total } =
    properties
  const { t, tPlain } = useT()

  let totalFiles = 0
  for (const row of breakdown) totalFiles += row.files

  return (
    <>
      <Headless.TabGroup
        onChange={function (index) {
          switchTab(storageTabs[index])
        }}
        selectedIndex={storageTabs.indexOf(category)}
      >
        <Headless.TabList className="mt-4 flex flex-wrap gap-2">
          {storageTabs.map(function (tab) {
            const count =
              tab === 'all'
                ? totalFiles
                : (breakdown.find((row) => row.category === tab)?.files ?? 0)
            return (
              <Headless.Tab
                aria-label={tPlain('storage.files.tabAria', {
                  category: tPlain(`storage.category.${tab}`),
                  count,
                })}
                className="group inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 data-selected:border-blue-600 data-selected:bg-blue-50 data-selected:text-blue-700 dark:border-zinc-700 dark:text-zinc-200 dark:data-selected:border-blue-400 dark:data-selected:bg-blue-950/30 dark:data-selected:text-blue-200 dark:focus-visible:ring-blue-300/40"
                key={tab}
              >
                <span>{t(`storage.category.${tab}`)}</span>
                <Badge className="min-w-6 justify-center rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700 group-data-selected:bg-blue-600 group-data-selected:text-white dark:bg-zinc-700 dark:text-zinc-100 dark:group-data-selected:bg-blue-400 dark:group-data-selected:text-blue-950">
                  {count}
                </Badge>
              </Headless.Tab>
            )
          })}
        </Headless.TabList>

        <Headless.TabPanels>
          {storageTabs.map(function (tab) {
            const visible = tab === category ? blobs : []

            return (
              <Headless.TabPanel className="focus:outline-none" key={tab}>
                {visible.length === 0 ? (
                  <Text className="mt-4">{t('storage.files.emptyCategory')}</Text>
                ) : (
                  <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {visible.map(function (blob) {
                      return (
                        <BlobItem
                          authorizationServer={authorizationServer}
                          category={blob.category}
                          blob={blob}
                          did={did}
                          key={blob.cid}
                        />
                      )
                    })}
                  </ul>
                )}
              </Headless.TabPanel>
            )
          })}
        </Headless.TabPanels>
      </Headless.TabGroup>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Text aria-live="polite" className="text-sm text-zinc-600 dark:text-zinc-300">
          {t('storage.files.showing', {
            category: t(`storage.category.${category}`),
            total,
            visible: blobs.length,
          })}
        </Text>
        <Button
          aria-label={tPlain('storage.files.showMoreAria', {
            category: tPlain(`storage.category.${category}`),
            count: total,
          })}
          className="disabled:cursor-not-allowed data-disabled:cursor-not-allowed"
          disabled={!hasMore}
          onClick={loadMore}
          outline
        >
          {t('storage.files.showMore')}
        </Button>
      </div>
    </>
  )

  function loadMore(): undefined {
    router.get(
      urlFor('storage.show'),
      { category, limit: blobs.length + blobsPerPage, snapshot: snapshot ?? undefined },
      {
        onError: onPaginationError,
        only: ['blobs', 'category', 'hasMore', 'snapshot', 'total'],
        preserveScroll: true,
        preserveState: true,
      }
    )
  }

  function switchTab(tab: StorageTab): undefined {
    if (tab === category) return
    router.get(
      urlFor('storage.show'),
      { category: tab },
      {
        onError: onPaginationError,
        only: ['blobs', 'category', 'hasMore', 'snapshot', 'total'],
        preserveScroll: true,
        preserveState: true,
      }
    )
  }

  function onPaginationError(): undefined {
    toast.error(tPlain('storage.files.loadError'))
  }
}

/**
 * Render a storage usage breakdown bar.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Element.
 */
function StorageBreakdown(properties: { breakdown: ReadonlyArray<Breakdown> }): React.ReactNode {
  const { breakdown } = properties
  const { locale, t, tPlain } = useT()
  let totalSize = 0

  for (const { bytes } of breakdown) {
    totalSize += bytes
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <Subheading level={2}>{t('storage.breakdown.title')}</Subheading>
        <span
          aria-label={formatByteSize(totalSize, locale)}
          className="text-sm tabular-nums text-zinc-900 dark:text-zinc-100"
        >
          {t('storage.breakdown.total', { size: formatByteSize(totalSize, locale) })}
        </span>
      </div>

      <div
        aria-label={breakdown
          .map(
            ({ bytes, category }) =>
              `${tPlain(`storage.category.${category ?? 'all'}`)}: ${formatByteSize(bytes, locale)}`
          )
          .join(', ')}
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
        role="img"
      >
        {breakdown.map(function ({ bytes, category }) {
          const percentage = (bytes / totalSize) * 100
          if (Number.isNaN(percentage) || percentage === 0) return
          return (
            <div
              className={`${categoryColor(category)} transition-all duration-500`}
              key={category}
              style={{ width: `${percentage}%` }}
            />
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
        {breakdown.map(function ({ bytes, category }) {
          return (
            <div className="flex items-center gap-2" key={category}>
              <span className={`size-2 shrink-0 rounded-full ${categoryColor(category)}`} />
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {tPlain(`storage.category.${category ?? 'all'}`)}
                </span>
                {' — '}
                <span className="tabular-nums">{formatByteSize(bytes, locale)}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Get a color for a category.
 *
 * @param category
 *   Category.
 * @returns
 *   Color.
 */
function categoryColor(category: StorageCategory): string {
  if (category === 'image') {
    return 'bg-yellow-400 dark:bg-yellow-300'
  }

  if (category === 'video') {
    return 'bg-blue-500 dark:bg-blue-400'
  }

  return 'bg-zinc-400 dark:bg-zinc-500'
}
