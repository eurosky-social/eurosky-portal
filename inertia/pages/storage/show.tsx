import * as Headless from '@headlessui/react'
import { Head } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '~/lib/badge'
import { Button } from '~/lib/button'
import Card from '~/lib/card'
import { Heading, Subheading } from '~/lib/heading'
import { Text } from '~/lib/text'
import { InertiaProps } from '~/types'
import { displayByteSize } from './bytes'
import { type FileCategory, fileCategoryFromMimeType } from './category'
import BlobItem from './BlobItem'

/**
 * Blob metadata exposed by the storage page backend.
 *
 * Like `BlobRow` from `@eurosky/blob-api` but has to be a `type` for `Inertia`.
 */
export type StorageBlob = {
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
 * Blob metadata exposed by the storage page backend.
 *
 * Like `StorageBreakdownCategory` from `portal_sync.js`.
 */
type Breakdown = {
  /**
   * Size in bytes.
   */
  bytes: number

  /**
   * Category.
   */
  category: string
}

/**
 * Properties.
 *
 * Like `ListBlobDetailsOutputBody` from `portal_sync`.
 * Has to be a `type` for `Inertia`.
 */
type StoragePageProperties = {
  /**
   * Blobs.
   */
  blobs: Array<StorageBlob>

  /**
   * Storage breakdown by category.
   */
  breakdown: Array<Breakdown>

  /**
   * User DID.
   */
  did: string
}

/**
 * Blobs to show per page.
 * Multiple of `4` so they somewhat fit on a big screen.
 */
const blobsPerPage = 48

const categories = ['image', 'video', 'other'] as const

/**
 * Formatter.
 */
const countFormatter = new Intl.NumberFormat()

/**
 * Plural rules.
 */
const countPluralRules = new Intl.PluralRules()

/**
 * Render the storage page.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Element.
 */
export default function StoragePage(properties: InertiaProps<StoragePageProperties>) {
  const { authorizationServer, blobs, breakdown, did } = properties

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
        <BlobsSection
          authorizationServer={authorizationServer}
          blobs={blobs}
          breakdown={breakdown}
          did={did}
        />
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
  blobs: ReadonlyArray<StorageBlob>
  breakdown: ReadonlyArray<Breakdown>
  did: string
}): React.ReactNode {
  const { authorizationServer, blobs, breakdown, did } = properties

  return (
    <>
      <Card className="p-5 md:p-6">
        <StorageBreakdown breakdown={breakdown} />
      </Card>
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
          <StorageBrowser authorizationServer={authorizationServer} blobs={blobs} did={did} />
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
  authorizationServer: string
  blobs: ReadonlyArray<StorageBlob>
  did: string
}): React.ReactNode {
  const { authorizationServer, blobs, did } = properties
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(blobsPerPage)

  const activeFiles = useMemo(
    function () {
      return filesByCategory(blobs, categories[activeTabIndex])
    },
    [activeTabIndex, blobs.length]
  )

  const visibleFiles = useMemo(
    function () {
      return activeFiles.slice(0, visibleCount)
    },
    [activeFiles, visibleCount]
  )

  useEffect(
    function () {
      setActiveTabIndex(0)
      setVisibleCount(blobsPerPage)
    },
    [authorizationServer, blobs.length, did]
  )

  return (
    <>
      <Headless.TabGroup
        onChange={function (index) {
          setActiveTabIndex(index)
        }}
        selectedIndex={activeTabIndex}
      >
        <Headless.TabList className="mt-4 flex flex-wrap gap-2">
          {categories.map(function (category) {
            const count = filesByCategory(blobs, category).length
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
          {categories.map(function (category) {
            const visible = category === categories[activeTabIndex] ? visibleFiles : []

            return (
              <Headless.TabPanel className="focus:outline-none" key={category}>
                {visible.length === 0 ? (
                  <Text className="mt-4">No files in this category.</Text>
                ) : (
                  <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {visible.map(function (blob) {
                      return (
                        <BlobItem
                          authorizationServer={authorizationServer}
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
          {'Showing ' +
            countFormatter.format(visibleFiles.length) +
            ' of ' +
            formatCountLabel(activeFiles.length, 'file') +
            ' in ' +
            displayCategory(categories[activeTabIndex]) +
            '.'}
        </Text>
        <Button
          aria-label={
            'Show more ' +
            displayCategory(categories[activeTabIndex]).toLowerCase() +
            ' ' +
            pluralize(activeFiles.length, 'file')
          }
          className="disabled:cursor-not-allowed data-disabled:cursor-not-allowed"
          disabled={visibleCount >= activeFiles.length}
          onClick={function () {
            setVisibleCount(function (current) {
              return Math.min(current + blobsPerPage, activeFiles.length)
            })
          }}
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
function StorageBreakdown(properties: { breakdown: ReadonlyArray<Breakdown> }): React.ReactNode {
  const { breakdown } = properties
  let totalSize = 0

  for (const { bytes } of breakdown) {
    totalSize += bytes
  }

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <Subheading level={2}>Breakdown</Subheading>
        <span
          aria-label={displayByteSize(totalSize)}
          className="text-sm tabular-nums text-zinc-900 dark:text-zinc-100"
        >
          {displayByteSize(totalSize) + ' total'}
        </span>
      </div>

      <div
        aria-label={breakdown
          .map(({ bytes, category }) => `${displayCategory(category)}: ${displayByteSize(bytes)}`)
          .join(', ')}
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
        role="img"
      >
        {breakdown.map(function ({ bytes, category }) {
          const percentage = (bytes / totalSize) * 100
          if (percentage === 0) return null
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
                  {displayCategory(category)}
                </span>
                {' — '}
                <span className="tabular-nums">{displayByteSize(bytes)}</span>
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
function categoryColor(category: string): string {
  if (category === 'image') {
    return 'bg-yellow-400 dark:bg-yellow-300'
  }

  if (category === 'video') {
    return 'bg-blue-500 dark:bg-blue-400'
  }

  return 'bg-zinc-400 dark:bg-zinc-500'
}

/**
 * Display a category.
 *
 * @param category
 *   Category.
 * @returns
 *   Category for humans (in plural).
 */
function displayCategory(category: string): string {
  if (category === 'image') {
    return 'Photos'
  }

  if (category === 'video') {
    return 'Videos'
  }

  return 'Other'
}

/**
 * Get files by category.
 *
 * @param blobs
 *   Blobs.
 * @param category
 *   Category.
 * @returns
 *   Files in the category.
 */
function filesByCategory(
  blobs: ReadonlyArray<StorageBlob>,
  activeCategory: FileCategory
): Array<StorageBlob> {
  const files: Array<StorageBlob> = []
  for (const blob of blobs) {
    if (fileCategoryFromMimeType(blob.mimeType) === activeCategory) {
      files.push(blob)
    }
  }
  return files
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
