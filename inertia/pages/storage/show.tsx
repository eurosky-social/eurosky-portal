import * as Headless from '@headlessui/react'
import { Head } from '@inertiajs/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '~/lib/badge'
import { Button } from '~/lib/button'
import Card from '~/lib/card'
import { Heading, Subheading } from '~/lib/heading'
import { Text } from '~/lib/text'
import { InertiaProps } from '~/types'
import { type BlobItemState, default as BlobItem } from './BlobItem'
import { displayByteSize } from './bytes'

/**
 * Metadata for a category.
 */
interface FileCategoryInfo {
  /**
   * Category.
   */
  category: FileCategory

  /**
   * Tailwind classes.
   */
  color: string

  /**
   * Label for humans.
   */
  label: string
}

/**
 * Categories.
 */
type FileCategory = 'image' | 'other' | 'video'

/**
 * Properties; `Inertia` needs this to be a `type`.
 */
type StoragePageProperties = {
  /**
   * File CIDs available for the signed-in account.
   *
   * When omitted, the page treats this as an empty list.
   */
  blobs: Array<string>

  /**
   * User DID.
   */
  did: string
}

/**
 * Allowed MIME types for inline images; when changing these make sure to update
 * `BlobItem.tsx` as well :)
 */
const allowedImages = new Set([
  'image/avif',
  // Bluesky turns GIFs into videos, but maybe something else does not.
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

/**
 * Allowed MIME types for inline videos; when changing these make sure to update
 * `BlobItem.tsx` as well :)
 */
const allowedVideos = new Set(['video/mp4', 'video/ogg', 'video/webm'])

/**
 * Blobs to show per page.
 * Multiple of `4` so they somewhat fit on a big screen.
 */
const blobsPerPage = 48

/**
 * Formatter.
 */
const countFormatter = new Intl.NumberFormat()

/**
 * Plural rules.
 */
const countPluralRules = new Intl.PluralRules()

/**
 * Storage breakdown segments.
 */
const fileCategoryInfo: Array<FileCategoryInfo> = [
  {
    category: 'image',
    color: 'bg-yellow-400 dark:bg-yellow-300',
    label: 'Photos',
  },
  {
    category: 'video',
    color: 'bg-blue-500 dark:bg-blue-400',
    label: 'Videos',
  },
  {
    category: 'other',
    color: 'bg-zinc-400 dark:bg-zinc-500',
    label: 'Other',
  },
]

/**
 * Max concurrent file fetches.
 */
const maxConcurrentFileFetches = 4

/**
 * Video element for capability checks.
 */
const videoElement = typeof document !== 'undefined' ? document.createElement('video') : undefined

/**
 * Render the storage page.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Element.
 */
export default function StoragePage(properties: InertiaProps<StoragePageProperties>) {
  const { authorizationServer, blobs, did } = properties

  // This page should only be used for signed in users.
  if (!authorizationServer || !did) {
    throw new Error('Missing required properties')
  }

  return (
    <>
      <Head title="Storage" />
      <div className="space-y-6">
        <div className="space-y-1">
          <Heading level={1}>Storage</Heading>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            See how much data your account is using and browse the documents that apps store for
            you.
          </Text>
        </div>
        <BlobsSection authorizationServer={authorizationServer} blobs={blobs} did={did} />
        <CollectionsSection />
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
  blobs: Array<string>
  did: string
}): React.ReactNode {
  const { authorizationServer, blobs = [], did } = properties
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0)
  const [blobStateByCid, setBlobStateByCid] = useState<Record<string, BlobItemState>>({})
  const [categoryByCid, setCategoryByCid] = useState<Record<string, FileCategory>>({})
  const [visibleCountByCategory, setVisibleCountByCategory] = useState<
    Record<FileCategory, number>
  >({
    image: blobsPerPage,
    other: blobsPerPage,
    video: blobsPerPage,
  })

  const inFlightCids = useRef(new Set<string>())
  const requestControllerRef = useRef(new AbortController())

  const blobBaseUrl = useMemo(
    function () {
      const url = new URL('/xrpc/com.atproto.sync.getBlob', authorizationServer)
      url.searchParams.set('did', did)
      return url
    },
    [authorizationServer, did]
  )

  const filesByCategory = useMemo(
    function () {
      return groupFilesByCategory(blobs, categoryByCid)
    },
    [blobs, categoryByCid]
  )

  const activeCategory = fileCategoryInfo[activeTabIndex].category ?? fileCategoryInfo[0].category
  const activeFiles = filesByCategory[activeCategory]

  const visibleFiles = useMemo(
    function () {
      const visibleLimit = visibleCountByCategory[activeCategory] ?? blobsPerPage
      return activeFiles.slice(0, visibleLimit)
    },
    [activeCategory, activeFiles, visibleCountByCategory]
  )

  useEffect(
    function () {
      requestControllerRef.current.abort()
      requestControllerRef.current = new AbortController()
      setActiveTabIndex(0)
      setCategoryByCid({})
      setBlobStateByCid({})
      setVisibleCountByCategory({
        image: blobsPerPage,
        other: blobsPerPage,
        video: blobsPerPage,
      })
      inFlightCids.current.clear()
    },
    [authorizationServer, blobs.length, did]
  )

  useEffect(function () {
    return function () {
      requestControllerRef.current.abort()
    }
  }, [])

  useEffect(
    function () {
      if (blobs.length === 0) {
        return
      }

      const queue = blobs.filter(function (cid) {
        return !blobStateByCid[cid] && !inFlightCids.current.has(cid)
      })

      if (queue.length === 0) {
        return
      }

      for (const cid of queue) {
        inFlightCids.current.add(cid)
      }

      const signal = requestControllerRef.current.signal

      // Intentionally not awaited.
      void (async function () {
        const workers = Array.from(
          { length: Math.min(maxConcurrentFileFetches, queue.length) },
          async function (_, workerIndex) {
            for (let index = workerIndex; index < queue.length; index += maxConcurrentFileFetches) {
              if (signal.aborted) {
                return
              }

              const cid = queue[index]
              const url = new URL(blobBaseUrl)
              url.searchParams.set('cid', cid)

              try {
                const state = await loadBlobItemState(url.toString(), signal)

                if (signal.aborted) {
                  return
                }

                setBlobStateByCid(function (current) {
                  if (current[cid]) {
                    return current
                  }

                  return { ...current, [cid]: state }
                })

                const category =
                  state.type === 'image' || state.type === 'video' ? state.type : 'other'

                updateFileCategory(cid, category, setCategoryByCid)
              } finally {
                inFlightCids.current.delete(cid)
              }
            }
          }
        )

        await Promise.all(workers)
      })()
    },
    [blobBaseUrl, blobStateByCid, blobs]
  )

  return (
    <>
      {blobs.length > 0 && (
        <Card className="p-5 md:p-6">
          <StorageBreakdown
            blobs={blobs}
            blobStateByCid={blobStateByCid}
            filesByCategory={filesByCategory}
          />
        </Card>
      )}
      <Card className="p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-2">
          <Subheading level={2}>Files</Subheading>
          <span
            aria-label={formatCountLabel(blobs.length, 'total file')}
            className="text-sm tabular-nums text-zinc-900 dark:text-zinc-100"
          >
            {formatCountLabel(blobs.length, 'file')}
          </span>
        </div>
        {blobs.length === 0 ? (
          <Text className="mt-4">No stored files were found for this account.</Text>
        ) : (
          <StorageBrowser
            activeCategory={activeCategory}
            activeFiles={activeFiles}
            activeTabIndex={activeTabIndex}
            blobStateByCid={blobStateByCid}
            filesByCategory={filesByCategory}
            onShowMore={function () {
              setVisibleCountByCategory(function (current) {
                const visible = (current[activeCategory] ?? blobsPerPage) + blobsPerPage
                return { ...current, [activeCategory]: visible }
              })
            }}
            onTabChange={function (index) {
              setActiveTabIndex(index)
            }}
            showMoreDisabled={
              (visibleCountByCategory[activeCategory] ?? blobsPerPage) >= activeFiles.length
            }
            visibleFiles={visibleFiles}
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
  return (
    <Card className="border border-dashed border-zinc-300 bg-zinc-50 p-5 md:p-6 dark:border-zinc-700 dark:bg-transparent">
      <Subheading level={2}>More</Subheading>
      <Text className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        This page currently focuses on stored files, specifically images and videos. More ways to
        view account data will be added in a future update.
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
  activeCategory: FileCategory
  activeFiles: Array<string>
  activeTabIndex: number
  blobStateByCid: Record<string, BlobItemState>
  filesByCategory: Record<FileCategory, Array<string>>
  onShowMore: () => undefined
  onTabChange: (index: number) => undefined
  showMoreDisabled: boolean
  visibleFiles: Array<string>
}): React.ReactNode {
  const {
    activeCategory,
    activeFiles,
    activeTabIndex,
    blobStateByCid,
    filesByCategory,
    onShowMore,
    onTabChange,
    showMoreDisabled,
    visibleFiles,
  } = properties

  return (
    <>
      <Headless.TabGroup onChange={onTabChange} selectedIndex={activeTabIndex}>
        <Headless.TabList className="mt-4 flex flex-wrap gap-2">
          {fileCategoryInfo.map(function ({ category }) {
            const count = filesByCategory[category].length
            return (
              <Headless.Tab
                aria-label={displayCategory(category) + ', ' + formatCountLabel(count, 'file')}
                className="group inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 data-selected:border-blue-600 data-selected:bg-blue-50 data-selected:text-blue-700 dark:border-zinc-700 dark:text-zinc-200 dark:data-selected:border-blue-400 dark:data-selected:bg-blue-950/30 dark:data-selected:text-blue-200 dark:focus-visible:ring-blue-300/40"
                key={category}
              >
                <span>{displayCategory(category)}</span>
                <Badge className="min-w-6 justify-center rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700 group-data-selected:bg-blue-600 group-data-selected:text-white dark:bg-zinc-700 dark:text-zinc-100 dark:group-data-selected:bg-blue-400 dark:group-data-selected:text-blue-950">
                  {count}
                </Badge>
              </Headless.Tab>
            )
          })}
        </Headless.TabList>

        <Headless.TabPanels>
          {fileCategoryInfo.map(function ({ category }) {
            const files = filesByCategory[category]
            const visible = category === activeCategory ? visibleFiles : []

            return (
              <Headless.TabPanel className="focus:outline-none" key={category}>
                {files.length === 0 ? (
                  <Text className="mt-4">No files in this category.</Text>
                ) : (
                  <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {visible.map(function (cid) {
                      return <BlobItem cid={cid} key={cid} state={blobStateByCid[cid]} />
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
          {'Showing ' +
            countFormatter.format(visibleFiles.length) +
            ' of ' +
            formatCountLabel(activeFiles.length, 'file') +
            ' in ' +
            displayCategory(activeCategory) +
            '.'}
        </Text>
        <Button
          aria-label={
            'Show more ' +
            displayCategory(activeCategory).toLowerCase() +
            ' ' +
            pluralize(activeFiles.length, 'file')
          }
          className="disabled:cursor-not-allowed data-disabled:cursor-not-allowed"
          disabled={showMoreDisabled}
          onClick={onShowMore}
          outline
        >
          Show more
        </Button>
      </div>
    </>
  )
}

/**
 * Render a storage usage breakdown bar.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Element.
 */
function StorageBreakdown(properties: {
  blobs: Array<string>
  blobStateByCid: Record<string, BlobItemState>
  filesByCategory: Record<FileCategory, Array<string>>
}): React.ReactNode {
  const { blobs, blobStateByCid, filesByCategory } = properties

  const sizeByCategory = useMemo(
    function () {
      const sizes: Record<FileCategory, number> = { image: 0, other: 0, video: 0 }

      for (const { category } of fileCategoryInfo) {
        for (const cid of filesByCategory[category]) {
          const state = blobStateByCid[cid]

          if (state && state.type !== 'error') {
            sizes[category] += state.size
          }
        }
      }

      return sizes
    },
    [blobStateByCid, filesByCategory]
  )

  const totalSize = sizeByCategory.image + sizeByCategory.video + sizeByCategory.other
  const loadedCount = Object.keys(blobStateByCid).length
  const loading = loadedCount < blobs.length

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <Subheading level={2}>Breakdown</Subheading>
        <span
          aria-live="polite"
          aria-label={displayByteSize(totalSize) + (loading ? ', loading' : '')}
          className="text-sm tabular-nums text-zinc-900 dark:text-zinc-100"
        >
          {displayByteSize(totalSize) + ' total'}
          {loading && <span className="ml-1 text-zinc-400 dark:text-zinc-500"> (loading…)</span>}
        </span>
      </div>

      {totalSize === 0 && loading ? (
        <div className="h-2.5 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
      ) : (
        <div
          aria-label={fileCategoryInfo
            .map((s) => `${s.label}: ${displayByteSize(sizeByCategory[s.category])}`)
            .join(', ')}
          className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
          role="img"
        >
          {totalSize > 0 &&
            fileCategoryInfo.map(function ({ category, color }) {
              const percentage = (sizeByCategory[category] / totalSize) * 100
              if (percentage === 0) return null
              return (
                <div
                  className={`${color} transition-all duration-500`}
                  key={category}
                  style={{ width: `${percentage}%` }}
                />
              )
            })}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
        {fileCategoryInfo.map(function ({ category, color, label }) {
          return (
            <div className="flex items-center gap-2" key={category}>
              <span className={`size-2 shrink-0 rounded-full ${color}`} />
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
                {' — '}
                <span className="tabular-nums">{displayByteSize(sizeByCategory[category])}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
/**
 * Display a byte.
 *
 * @param byte
 *   Byte.
 * @returns
 *   Byte for humans (example: 0a).
 */
function displayByte(byte: number): string {
  return byte.toString(16).padStart(2, '0')
}

/**
 * Display bytes as a hex string.
 *
 * @param bytes
 *   Byte array.
 * @returns
 *   Bytes for humans (example: ff d8 ff e0 00 10 4a).
 */
function displayBytes(bytes: Uint8Array): string {
  const max = 128
  const value = Array.from(bytes.slice(0, max)).map(displayByte).join(' ')
  return bytes.length > max ? value + ' …' : value
}

/**
 * Display a category.
 *
 * @param category
 *   Category.
 * @returns
 *   Category for humans (in plural).
 */
function displayCategory(category: FileCategory): string {
  if (category === 'image') {
    return 'Photos'
  }

  if (category === 'video') {
    return 'Videos'
  }

  return 'Other'
}

/**
 * Format a count with a singular/plural noun.
 *
 * @param count
 *   Count.
 * @param singular
 *   Singular noun or noun phrase.
 * @param plural
 *   Optional plural noun or noun phrase.
 * @returns
 *   Human-readable label.
 */
function formatCountLabel(count: number, singular: string, plural?: string): string {
  return countFormatter.format(count) + ' ' + pluralize(count, singular, plural)
}

/**
 * Group files by current resolved category.
 *
 * Files use `other` until an item is loaded and its type (if any) is known.
 *
 * @param blobs
 *   File CIDs.
 * @param categoryByCid
 *   Resolved categories by CID.
 * @returns
 *   Files grouped by category.
 */
function groupFilesByCategory(
  blobs: Array<string>,
  categoryByCid: Record<string, FileCategory>
): Record<FileCategory, Array<string>> {
  const grouped: Record<FileCategory, Array<string>> = {
    image: [],
    other: [],
    video: [],
  }

  for (const cid of blobs) {
    const category = categoryByCid[cid] ?? 'other'
    grouped[category].push(cid)
  }

  return grouped
}

/**
 * Resolve a blob once into renderable state.
 *
 * @param src
 *   Blob source URL.
 * @param signal
 *   Abort signal.
 * @returns
 *   Resolved state for rendering.
 */
async function loadBlobItemState(src: string, signal: AbortSignal): Promise<BlobItemState> {
  try {
    let response = await fetch(src, { headers: { Range: `bytes=0-${256 - 1}` }, signal })

    // Retry without Range if the server explicitly does not support range
    // requests.
    if (response.status === 416) {
      response = await fetch(src, { signal })
    }

    if (!response.ok) {
      return { reason: 'Cannot load blob: HTTP ' + response.status, type: 'error' }
    }

    const contentLength = response.headers.get('content-length')
    const contentRange = response.headers.get('content-range')
    const contentType = response.headers.get('content-type') ?? ''
    const type = mediaType(contentType)
    const totalFromContentRange = contentRange?.match(/\/(\d+)$/)?.[1]
    const sizeFromHeaders = totalFromContentRange
      ? Number(totalFromContentRange)
      : contentLength
        ? Number(contentLength)
        : Number.NaN

    // Use direct media URL for displayable types to avoid extra JS buffering.
    if (type === 'image' || type === 'video') {
      return { contentType, size: sizeFromHeaders, type, url: src }
    }

    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    const preview = displayBytes(bytes)
    const size = Number.isFinite(sizeFromHeaders) ? sizeFromHeaders : bytes.length

    return { contentType, preview, size, type: 'unknown', url: src }
  } catch (error) {
    return { reason: String(error), type: 'error' }
  }
}
/**
 * Check if something is displayable media.
 *
 * @param type
 *   Content type.
 * @returns
 *   Media type.
 */
function mediaType(type: string): 'image' | 'video' | undefined {
  const mime = normalizeMimeType(type)

  if (allowedImages.has(mime)) {
    return 'image'
  }

  if (allowedVideos.has(mime) && videoElement && videoElement.canPlayType(type)) {
    return 'video'
  }
}

/**
 * Normalize a `content-type` value to a lowercase MIME type.
 *
 * @param value
 *   Raw `content-type` header value.
 * @returns
 *   Normalized MIME type.
 */
function normalizeMimeType(value: string): string {
  return value.split(';')[0]?.trim().toLowerCase() ?? ''
}

/**
 * Select a singular or plural label for a count.
 *
 * @param count
 *   Count.
 * @param singular
 *   Singular noun or noun phrase.
 * @param plural
 *   Optional plural noun or noun phrase.
 * @returns
 *   Singular or plural label.
 */
function pluralize(count: number, singular: string, plural?: string): string {
  return countPluralRules.select(count) === 'one' ? singular : (plural ?? singular + 's')
}

/**
 * Update category for a specific file CID only when changed.
 *
 * @param cid
 *   File CID.
 * @param nextCategory
 *   New resolved category.
 * @param setCategoryByCid
 *   State setter.
 * @returns
 *   Nothing.
 */
function updateFileCategory(
  cid: string,
  nextCategory: FileCategory,
  setCategoryByCid: React.Dispatch<React.SetStateAction<Record<string, FileCategory>>>
): undefined {
  setCategoryByCid(function (current) {
    if (current[cid] === nextCategory) {
      return current
    }

    return { ...current, [cid]: nextCategory }
  })
}
