import { ArrowDownTrayIcon, ArrowPathIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/solid'
import { type ReactNode, useState } from 'react'
import type { StorageBlobRow } from '#services/storage_service'
import { isKnownMimeType, normalizeMimeType } from '#shared/mime'
import type { BlobLocator } from '#utils/blob'
import { BlobImage } from '~/components/BlobImage'
import { NewTab } from '~/components/NewTab'
import { Button } from '~/lib/button'
import { useT } from '~/lib/i18n'
import { toBlobPdsUrl } from '~/utils/blob'
import { formatByteSize } from '~/utils/bytes'
import { formatList } from '~/utils/list'
import { useMediaQuery } from '~/utils/media_query'
import { formatMimeType, mimeTypeExtension } from '~/utils/mime'

/**
 * Properties for {@linkcode BlobItem}.
 */
interface BlobItemProperties {
  /**
   * Metadata.
   */
  blob: StorageBlobRow

  /**
   * DID.
   */
  did: string

  /**
   * PDS.
   */
  pds: string
}

/**
 * Cell in data display.
 */
interface Cell {
  /**
   * Key.
   */
  key: ReactNode

  /**
   * Value.
   */
  value: ReactNode
}

/**
 * Classes for action buttons.
 */
const actionClassName =
  'size-8 justify-center p-0! *:data-[slot=icon]:m-0! *:data-[slot=icon]:size-4!'

/**
 * Icon shown in action buttons while busy.
 */
const busyIcon = <ArrowPathIcon aria-hidden="true" className="animate-spin" data-slot="icon" />

/**
 * Classes for boxes shown instead of a preview.
 */
const placeholderClassName =
  'mb-2 aspect-square w-full rounded-md border border-neutral-950/10 bg-neutral-950/2.5 p-3 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400 flex flex-col items-center justify-center gap-2'

/**
 * Threshold to defer media loading until user request.
 */
const defaultDeferThreshold = 2 * 1024 * 1024

/**
 * Threshold when preferring less data use.
 */
const reducedDataDeferThreshold = 256 * 1024

/**
 * Video element for capability checks.
 */
const videoElement = typeof document !== 'undefined' ? document.createElement('video') : undefined

/**
 * Show a blob.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Element.
 */
export default function BlobItem(properties: BlobItemProperties): ReactNode {
  const { blob, did, pds } = properties
  const { category } = blob
  const { locale, t, tPlain } = useT()
  const [downloading, setDownloading] = useState<boolean>(false)
  const [error, setError] = useState<string | undefined>()
  const [opening, setOpening] = useState<boolean>(false)
  const [requested, setRequested] = useState<boolean>(false)
  // Assume less data is preferred on the server.
  const reduceData = useMediaQuery('(prefers-reduced-data: reduce)', true)

  let value = (
    <div className="mb-2 aspect-square w-full animate-pulse rounded-md bg-neutral-950/5 dark:bg-white/10" />
  )
  const cells: Array<Cell> = []

  const locator: BlobLocator = {
    cid: blob.cid,
    did: did as BlobLocator['did'],
    pds,
  }
  const url = toBlobPdsUrl(locator)

  const threshold = reduceData ? reducedDataDeferThreshold : defaultDeferThreshold
  const sizeLabel = formatByteSize(blob.size, locale)
  const mimeType = normalizeMimeType(blob.mimeType)
  const typeLabel = blob.mimeType ? formatMimeType(tPlain, mimeType) : tPlain('mimeType.unknown')
  const fileLabel = formatList([typeLabel, sizeLabel], locale, { style: 'short', type: 'unit' })

  if (category === 'image') {
    value = (
      <BlobImage
        alt=""
        blob={locator}
        className="mb-2 aspect-square w-full rounded-md object-cover"
        decoding="async"
        loading="lazy"
      />
    )
  } else if (
    category === 'video' &&
    videoElement &&
    blob.mimeType &&
    videoElement.canPlayType(blob.mimeType)
  ) {
    // Defer loading for large media.
    if (blob.size >= threshold && !requested) {
      value = (
        <div className={placeholderClassName}>
          <Button
            onClick={function () {
              setRequested(true)
            }}
            outline
          >
            {t('files.preview.load')}
            <span className="sr-only"> {fileLabel}</span>
          </Button>
        </div>
      )
    } else {
      value = (
        <video
          aria-label={fileLabel}
          className="mb-2 aspect-square w-full rounded-md object-cover"
          controls
          preload={requested ? 'auto' : 'metadata'}
          src={url}
        />
      )
    }
  } else {
    value = <div className={placeholderClassName}>{t('files.preview.notAvailable')}</div>
  }

  cells.push(
    { key: t('files.field.size'), value: sizeLabel },
    { key: t('files.field.type'), value: typeLabel }
  )

  return (
    <li className="group relative rounded-lg border border-neutral-950/10 p-3 dark:border-white/10">
      <div className="absolute top-5 right-5 z-10 inline-flex items-center gap-2 transition-opacity duration-200 sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100">
        {isKnownMimeType(mimeType) ? (
          <Button
            className={actionClassName}
            disabled={opening}
            title={tPlain('files.open.action')}
            onClick={async function () {
              setError(undefined)
              setOpening(true)

              try {
                await openBlob(url)
              } catch {
                setError(tPlain('files.open.error'))
              } finally {
                setOpening(false)
              }
            }}
          >
            {opening ? busyIcon : <ArrowsPointingOutIcon aria-hidden="true" data-slot="icon" />}
            <span className="sr-only">
              {opening ? t('files.open.actionBusy') : t('files.open.action')} {fileLabel}
            </span>
            <NewTab icon={false} />
          </Button>
        ) : undefined}
        <Button
          className={actionClassName}
          disabled={downloading}
          title={tPlain('files.download.action')}
          onClick={async function () {
            setError(undefined)
            setDownloading(true)

            try {
              await downloadBlob(url, displayFilename(blob.cid, mimeType))
            } catch {
              setError(tPlain('files.download.error'))
            } finally {
              setDownloading(false)
            }
          }}
        >
          {downloading ? busyIcon : <ArrowDownTrayIcon aria-hidden="true" data-slot="icon" />}
          <span className="sr-only">
            {downloading ? t('files.download.actionBusy') : t('files.download.action')} {fileLabel}
          </span>
        </Button>
      </div>
      {value}
      {cells.length > 0 ? (
        <dl>
          {cells.map(({ key, value }, index) => (
            <div className="grid grid-cols-1 gap-1 py-1 md:grid-cols-4" key={index}>
              <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{key}</dt>
              <dd className="col-span-3 break-all text-sm text-neutral-950 dark:text-white">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : undefined}
      <div role="alert">
        {error ? (
          <p className="mt-1 text-base/6 text-red-600 sm:text-sm/6 dark:text-red-400">{error}</p>
        ) : undefined}
      </div>
    </li>
  )
}

/**
 * Make a file name for humans; specifically for downloading.
 *
 * @param cid
 *   CID.
 * @param type
 *   Normalized MIME type.
 * @returns
 *   File name.
 */
function displayFilename(cid: string, type: string): string {
  const extension = mimeTypeExtension(type)
  // Shared prefix so that things are downloaded next to each other and that
  // there is *some* explanation where they came from.
  // `24` is a balance between collisions and readability; also note that the
  // first characters are often equal <https://atproto.com/specs/blob#blob-metadata>.
  let name = 'eurosky-blob-' + cid.slice(0, 24)

  if (extension) {
    name += '.' + extension
  }

  return name
}

/**
 * Download a blob and save it with a filename; avoids server `content-disposition`
 * forcing the CID w/o extension.
 *
 * @param url
 *   URL.
 * @param filename
 *   File name.
 * @returns
 *   Promise that resolves to nothing when done.
 */
async function downloadBlob(url: string, filename: string): Promise<undefined> {
  const anchor = document.createElement('a')
  anchor.href = await fetchObjectUrl(url)
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}

/**
 * Open a blob in a new tab; avoids server `content-disposition: attachment`
 * forcing download; this *should* work when used in a click handler.
 *
 * @param url
 *   URL.
 * @returns
 *   Promise that resolves to nothing when done.
 */
async function openBlob(url: string): Promise<undefined> {
  const targetWindow = window.open('', '_blank')

  if (!targetWindow) {
    throw new Error('Cannot open blob: popup blocked')
  }

  let objectUrl: string

  try {
    objectUrl = await fetchObjectUrl(url)
  } catch (error) {
    targetWindow.close()
    throw error
  }

  targetWindow.opener = undefined
  targetWindow.location.href = objectUrl
}

/**
 * Fetch a blob into an object URL, which is revoked after a minute.
 * Revoking right away can cancel downloads, or break tabs, in some browsers.
 *
 * @param url
 *   URL.
 * @returns
 *   Promise that resolves to an object URL.
 */
async function fetchObjectUrl(url: string): Promise<string> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Cannot fetch blob: HTTP ' + response.status)
  }

  const objectUrl = URL.createObjectURL(await response.blob())

  window.setTimeout(function () {
    URL.revokeObjectURL(objectUrl)
  }, 60_000)

  return objectUrl
}
