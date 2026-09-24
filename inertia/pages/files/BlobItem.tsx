import { ArrowDownTrayIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/solid'
import { type ReactNode, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { type StorageCategory } from '#shared/storage'
import type { BlobLocator } from '#utils/blob'
import { BlobImage } from '~/components/BlobImage'
import { Button } from '~/lib/button'
import { useT } from '~/lib/i18n'
import { toBlobPdsUrl } from '~/utils/blob'
import { formatByteSize } from '~/utils/bytes'
import { formatMimeType, mimeTypeExtension } from '~/utils/mime'
import type { StorageBlob } from './show'

/**
 * Properties for {@linkcode BlobItem}.
 */
interface BlobItemProperties {
  /**
   * Base.
   */
  authorizationServer: string

  /**
   * Metadata.
   */
  blob: StorageBlob

  /**
   * Category.
   */
  category: StorageCategory

  /**
   * DID.
   */
  did: string
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
  const { authorizationServer, blob, category, did } = properties
  const { locale, t, tPlain } = useT()
  const [downloading, setDownloading] = useState<boolean>(false)
  const [opening, setOpening] = useState<boolean>(false)
  const [reduceData, setReduceData] = useState<boolean>(
    // Assume less data is preferred.
    typeof window === 'undefined'
      ? true
      : window.matchMedia('(prefers-reduced-data: reduce)').matches
  )
  const [requested, setRequested] = useState<boolean>(false)

  useEffect(function () {
    if (typeof window === 'undefined') return

    const query = window.matchMedia('(prefers-reduced-data: reduce)')

    onChange()

    query.addEventListener('change', onChange)

    return function () {
      query.removeEventListener('change', onChange)
    }

    function onChange() {
      setReduceData(query.matches)
    }
  }, [])

  let value = (
    <div className="mb-2 aspect-square w-full animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
  )
  const cells: Array<Cell> = []

  const locator: BlobLocator = {
    cid: blob.cid,
    did: did as BlobLocator['did'],
    pds: authorizationServer,
  }
  const url = toBlobPdsUrl(locator)

  const threshold = reduceData ? reducedDataDeferThreshold : defaultDeferThreshold

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
        <div className="mb-2 aspect-square w-full rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900/40 flex flex-col items-center justify-center gap-2">
          <Button
            aria-label={tPlain('files.preview.loadLargeAria', {
              mimeType: formatMimeType(tPlain, blob.mimeType),
            })}
            className="dark:border-slate-600!"
            onClick={function () {
              setRequested(true)
            }}
            outline
          >
            {t('files.preview.loadLarge', { mimeType: formatMimeType(t, blob.mimeType) })}
          </Button>
        </div>
      )
    } else {
      value = (
        <video
          className="mb-2 aspect-square w-full rounded-md object-cover"
          controls
          preload={requested ? 'auto' : 'metadata'}
          src={url}
        />
      )
    }
  } else {
    value = (
      <div className="mb-2 aspect-square w-full rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900/40 flex flex-col items-center justify-center gap-2">
        {t('files.preview.notAvailable')}
      </div>
    )
  }

  cells.push(
    { key: t('files.field.size'), value: formatByteSize(blob.size, locale) },
    {
      key: t('files.field.type'),
      value: blob.mimeType ? formatMimeType(t, blob.mimeType) : t('mimeType.unknown'),
    }
  )

  return (
    <li className="group relative rounded-lg border border-zinc-200 p-3 dark:border-white/10">
      <div className="absolute top-5 right-5 z-10 inline-flex items-center gap-2 transition-opacity duration-200 sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100">
        <button
          aria-label={tPlain('files.open.aria')}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white/90 px-2 py-1 text-xs font-medium text-zinc-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white active:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-700 dark:focus-visible:ring-blue-300/40"
          disabled={opening}
          onClick={async function () {
            setOpening(true)

            try {
              await openBlob(url)
            } catch {
              toast.error(tPlain('files.open.error'))
            } finally {
              setOpening(false)
            }
          }}
          type="button"
        >
          <ArrowsPointingOutIcon aria-hidden="true" className="size-4" data-slot="icon" />
          {opening ? t('files.open.actionBusy') : t('files.open.action')}
        </button>
        <button
          aria-label={tPlain('files.download.aria')}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white/90 px-2 py-1 text-xs font-medium text-zinc-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white active:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-700 dark:focus-visible:ring-blue-300/40"
          disabled={downloading}
          onClick={async function () {
            setDownloading(true)

            try {
              await downloadBlob(url, displayFilename(blob.cid, blob.mimeType))
            } catch {
              toast.error(tPlain('files.download.error'))
            } finally {
              setDownloading(false)
            }
          }}
          type="button"
        >
          <ArrowDownTrayIcon aria-hidden="true" className="size-4" data-slot="icon" />
          {downloading ? t('files.download.actionBusy') : t('files.download.action')}
        </button>
      </div>
      {value}
      {cells.length > 0 ? (
        <dl>
          {cells.map(({ key, value }, index) => (
            <div className="grid grid-cols-1 gap-1 py-1 md:grid-cols-4" key={index}>
              <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{key}</dt>
              <dd className="col-span-3 break-all text-sm text-zinc-900 dark:text-zinc-100">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : undefined}
    </li>
  )
}

/**
 * Make a file name for humans; specifically for downloading.
 *
 * @param cid
 *   CID.
 * @param type
 *   Value from `content-type` header.
 * @returns
 *   File name.
 */
function displayFilename(cid: string, type?: string | undefined): string {
  const extension = type ? mimeTypeExtension(type) : undefined
  // Shared prefix so that things are downloaded next to each other and that
  // there is *some* explanation where they came from.
  // `24` is a balance between colisions and readability; also note that the
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
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Cannot download blob: HTTP ' + response.status)
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  try {
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    anchor.style.display = 'none'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
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

  const response = await fetch(url)

  if (!response.ok) {
    targetWindow.close()
    throw new Error('Cannot open blob: HTTP ' + response.status)
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  targetWindow.opener = undefined
  targetWindow.location.href = objectUrl

  window.setTimeout(function () {
    URL.revokeObjectURL(objectUrl)
  }, 60_000)
}
