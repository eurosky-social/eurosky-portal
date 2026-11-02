import * as Headless from '@headlessui/react'
import { Head, router } from '@inertiajs/react'
import { useState } from 'react'
import type {
  GetStorageResult,
  StorageBlobRow,
  StorageBreakdownRow,
} from '#services/storage_service'
import type { Jsonify } from '#shared/json'
import { type StorageCategory, type StorageTab, storageCategories } from '#shared/storage'
import { urlFor } from '~/client'
import { PageHeader } from '~/components/PageHeader'
import { UnderConstruction } from '~/components/UnderConstruction'
import { Button } from '~/lib/button'
import Card from '~/lib/card'
import { Subheading } from '~/lib/heading'
import { useT } from '~/lib/i18n'
import { Text } from '~/lib/text'
import { InertiaProps } from '~/types'
import { formatByteSize } from '~/utils/bytes'
import { formatList } from '~/utils/list'
import { formatNumber } from '~/utils/number'
import { usePoll } from '~/utils/use_poll'
import BlobItem from './BlobItem'

/**
 * Properties added by the controller.
 */
interface FilesPageExtraProperties {
  /**
   * User DID.
   */
  did: string
}

/**
 * Properties.
 */
type FilesPageProperties = Jsonify<FilesPageExtraProperties & GetStorageResult>

/**
 * Tabs in display order.
 */
const storageTabs: ReadonlyArray<StorageTab> = ['all', ...storageCategories]

/**
 * Render the files page.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Element.
 */
export default function FilesPage(properties: InertiaProps<FilesPageProperties>) {
  const { did, state } = properties
  const { t, tPlain } = useT()

  // This page should only be used for signed in users.
  if (!did) {
    throw new Error('Missing required properties')
  }

  // Keep polling after a failure too: the job retries.
  usePoll(state !== 'ready')

  return (
    <>
      <Head title={tPlain('files.title')} />
      <div className="space-y-6">
        <PageHeader
          description={
            state === 'syncing'
              ? t('files.syncing')
              : state === 'failed'
                ? t('files.failed')
                : t('files.subtitle')
          }
          live
          title={t('files.title')}
        />
        <UnderConstruction>{t('files.underConstruction.text')}</UnderConstruction>
        {state === 'ready' ? (
          <BlobsSection
            blobs={properties.blobs}
            breakdown={properties.breakdown}
            category={properties.category}
            did={did}
            next={properties.next}
            pds={properties.pds}
            snapshot={properties.snapshot}
            total={properties.total}
          />
        ) : undefined}
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
  blobs: ReadonlyArray<StorageBlobRow>
  breakdown: ReadonlyArray<StorageBreakdownRow>
  category: StorageTab
  did: string
  next: string | null
  pds: string
  snapshot: string | null
  total: number
}): React.ReactNode {
  const { blobs, breakdown, category, did, next, pds, snapshot, total } = properties
  const { t } = useT()

  let totalFiles = 0
  for (const row of breakdown) totalFiles += row.files

  return (
    <>
      <Card className="p-5 md:p-6">
        <FilesBreakdown breakdown={breakdown} />
      </Card>
      <Card className="p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-2">
          <Subheading level={2}>{t('files.heading')}</Subheading>
          <span className="text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
            {t('files.count', { count: totalFiles })}
          </span>
        </div>
        {breakdown.length === 0 ? (
          <Text className="mt-4">{t('files.empty')}</Text>
        ) : (
          <FilesBrowser
            blobs={blobs}
            breakdown={breakdown}
            category={category}
            did={did}
            next={next}
            pds={pds}
            snapshot={snapshot}
            total={total}
            totalFiles={totalFiles}
          />
        )}
      </Card>
    </>
  )
}

/**
 * Render the tabbed file browser.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Element.
 */
function FilesBrowser(properties: {
  blobs: ReadonlyArray<StorageBlobRow>
  breakdown: ReadonlyArray<StorageBreakdownRow>
  category: StorageTab
  did: string
  next: string | null
  pds: string
  snapshot: string | null
  total: number
  totalFiles: number
}): React.ReactNode {
  const { blobs, breakdown, category, did, next, pds, snapshot, total, totalFiles } = properties
  const { locale, t, tPlain } = useT()
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  return (
    <>
      <Headless.TabGroup
        onChange={function (index) {
          const tab = storageTabs[index]
          if (tab) switchTab(tab)
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
                aria-label={formatList(
                  [tPlain(`files.category.${tab}`), tPlain('files.count', { count })],
                  locale,
                  { style: 'short', type: 'unit' }
                )}
                className="group inline-flex items-center gap-2 rounded-full border border-stone-mid px-4 py-1.5 text-sm font-medium text-ink outline-offset-2 transition-colors data-hover:border-charcoal data-selected:border-ink data-selected:bg-ink data-selected:text-cotton dark:border-neutral-700 dark:text-white dark:data-hover:border-neutral-400 dark:data-selected:border-white dark:data-selected:bg-white dark:data-selected:text-ink"
                key={tab}
              >
                <span>{t(`files.category.${tab}`)}</span>
                <span className="inline-flex min-w-6 justify-center rounded-full bg-stone-light px-2 py-0.5 text-xs/5 font-semibold tabular-nums text-ink group-data-selected:bg-white/20 group-data-selected:text-cotton dark:bg-white/10 dark:text-white dark:group-data-selected:bg-ink/10 dark:group-data-selected:text-ink">
                  {formatNumber(count, locale)}
                </span>
              </Headless.Tab>
            )
          })}
        </Headless.TabList>

        <Headless.TabPanels>
          {storageTabs.map(function (tab) {
            const visible = tab === category ? blobs : []

            return (
              <Headless.TabPanel
                className="rounded-md outline-offset-2 data-focus:outline-2 data-focus:outline-blue-600"
                key={tab}
              >
                {visible.length === 0 ? (
                  <Text className="mt-4">{t('files.emptyCategory')}</Text>
                ) : (
                  <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {visible.map(function (blob) {
                      return <BlobItem blob={blob} did={did} key={blob.cid} pds={pds} />
                    })}
                  </ul>
                )}
              </Headless.TabPanel>
            )
          })}
        </Headless.TabPanels>
      </Headless.TabGroup>

      {blobs.length === 0 ? undefined : (
        <div className="mt-6 flex flex-col items-center gap-3">
          <Text aria-live="polite">
            {category === 'all'
              ? t('files.showing', { total, visible: blobs.length })
              : t('files.showingCategory', {
                  category: t(`files.category.${category}`),
                  total,
                  visible: blobs.length,
                })}
          </Text>
          <Button disabled={loading || !next} onClick={loadMore} outline>
            {t('files.loadMore')}
          </Button>
        </div>
      )}
      <div role="alert">
        {error ? (
          <p className="mt-4 text-base/6 text-red-600 sm:text-sm/6 dark:text-red-400">{error}</p>
        ) : undefined}
      </div>
    </>
  )

  function loadMore(): undefined {
    if (!next) return
    router.get(
      urlFor('files.show'),
      { after: next, category, snapshot: snapshot ?? undefined },
      {
        onError: onPaginationError,
        onFinish() {
          setLoading(false)
        },
        onStart() {
          setLoading(true)
        },
        onSuccess: onPaginationSuccess,
        only: ['blobs', 'next'],
        preserveScroll: true,
        preserveState: true,
        preserveUrl: true,
      }
    )
  }

  function switchTab(tab: StorageTab): undefined {
    if (tab === category) return
    router.get(
      urlFor('files.show'),
      { category: tab },
      {
        onError: onPaginationError,
        onSuccess: onPaginationSuccess,
        only: ['blobs', 'breakdown', 'category', 'next', 'snapshot', 'total'],
        preserveScroll: true,
        preserveState: true,
        reset: ['blobs'],
      }
    )
  }

  function onPaginationError(): undefined {
    setError(tPlain('files.loadError'))
  }

  function onPaginationSuccess(): undefined {
    setError(undefined)
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
function FilesBreakdown(properties: {
  breakdown: ReadonlyArray<StorageBreakdownRow>
}): React.ReactNode {
  const { breakdown } = properties
  const { locale, t, tPlain } = useT()
  let totalSize = 0

  for (const { bytes } of breakdown) {
    totalSize += bytes
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <Subheading level={2}>{t('files.breakdown.title')}</Subheading>
        <span className="text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
          {t('files.breakdown.total', { size: formatByteSize(totalSize, locale) })}
        </span>
      </div>

      <div
        aria-label={formatList(
          breakdown.map(({ bytes, category }) =>
            tPlain('files.breakdown.item', {
              category: tPlain(`files.category.${category}`),
              size: formatByteSize(bytes, locale),
            })
          ),
          locale
        )}
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-950/5 dark:bg-white/10"
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
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('files.breakdown.item', {
                  category: (
                    <span className="font-medium text-neutral-950 dark:text-white">
                      {tPlain(`files.category.${category}`)}
                    </span>
                  ),
                  size: <span className="tabular-nums">{formatByteSize(bytes, locale)}</span>,
                })}
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
    return 'bg-brand'
  }

  if (category === 'video') {
    return 'bg-charcoal dark:bg-neutral-400'
  }

  return 'bg-stone-mid dark:bg-neutral-700'
}
