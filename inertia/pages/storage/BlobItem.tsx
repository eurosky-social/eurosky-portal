import { useEffect, useState } from 'react'
import { ArrowDownTrayIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/solid'
import { Button } from '~/lib/button'
import { Code } from '~/lib/text'
import { displayByteSize } from './bytes'
import { fileCategoryFromMimeType } from './category'
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
  key: string

  /**
   * Value.
   */
  value: React.ReactNode
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
 * MIME types to file extensions; needed to make files useful after downloading
 * and showing in finder or so.
 */
const mediaTypeExtensions = new Map([
  ['image/avif', 'avif'],
  ['image/gif', 'gif'],
  ['image/jpeg', 'jpg'],
  ['video/mp4', 'mp4'],
  ['video/ogg', 'ogv'],
  ['image/png', 'png'],
  ['video/webm', 'webm'],
  ['image/webp', 'webp'],
])

/**
 * MIME types to labels for humans.
 */
const supportedMediaTypeLabels = new Map([
  ['image/avif', 'AV1 Image File Format (AVIF)'],
  ['image/gif', 'Graphics Interchange Format (GIF)'],
  ['image/jpeg', 'JPEG Image'],
  ['video/mp4', 'MPEG-4 Video (MP4)'],
  ['video/ogg', 'Ogg Video'],
  ['image/png', 'Portable Network Graphics (PNG)'],
  ['video/webm', 'WebM Video'],
  ['image/webp', 'WebP Image'],
])

/**
 * Show a blob.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Element.
 */
export default function BlobItem(properties: BlobItemProperties): React.ReactNode {
  const { authorizationServer, blob, did } = properties
  const [downloading, setDownloading] = useState<boolean>(false)
  const [opening, setOpening] = useState<boolean>(false)
  const [reduceData, setReduceData] = useState<boolean>(
    typeof window === 'undefined'
      ? // Assume less data is preferred.
        true
      : window.matchMedia('(prefers-reduced-data: reduce)').matches
  )
  const [requested, setRequested] = useState<boolean>(false)

  useEffect(
    function () {
      setDownloading(false)
      setOpening(false)
      setRequested(false)
    },
    [blob]
  )

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

  const url = new URL('/xrpc/com.atproto.sync.getBlob', authorizationServer)
  url.searchParams.set('cid', blob.cid)
  url.searchParams.set('did', did)

  const threshold = reduceData ? reducedDataDeferThreshold : defaultDeferThreshold
  const category = fileCategoryFromMimeType(blob.mimeType)

  if (category === 'image' || category === 'video') {
    // Defer loading for large media.
    if (blob.size >= threshold && !requested) {
      value = (
        <div className="mb-2 aspect-square w-full rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900/40 flex flex-col items-center justify-center gap-2">
          <Button
            aria-label={'Load large ' + blob.mimeType + ' preview'}
            className="dark:border-slate-600!"
            onClick={function () {
              setRequested(true)
            }}
            outline
          >
            Load large {blob.mimeType}
          </Button>
        </div>
      )
    } else if (category === 'image') {
      value = (
        <img
          alt=""
          className="mb-2 aspect-square w-full rounded-md object-cover"
          decoding="async"
          fetchPriority={requested ? 'auto' : 'low'}
          loading={requested ? 'eager' : 'lazy'}
          src={String(url)}
        />
      )
    } else {
      value = (
        <video
          className="mb-2 aspect-square w-full rounded-md object-cover"
          controls
          preload={requested ? 'auto' : 'metadata'}
          src={String(url)}
        />
      )
    }
  } else {
    value = (
      <div className="mb-2 aspect-square w-full rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900/40 flex flex-col items-center justify-center gap-2">
        Preview not available.
      </div>
    )
  }

  cells.push(
    { key: 'Size', value: displayByteSize(blob.size) },
    { key: 'Type', value: displayFileType(blob.mimeType) }
  )

  return (
    <li className="group relative rounded-lg border border-zinc-200 p-3 dark:border-white/10">
      <div className="absolute top-5 right-5 z-10 inline-flex items-center gap-2 transition-opacity duration-200 sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100">
        <button
          aria-label="Open file in a new tab"
          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white/90 px-2 py-1 text-xs font-medium text-zinc-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white active:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-700 dark:focus-visible:ring-blue-300/40"
          disabled={opening}
          onClick={async function () {
            setOpening(true)

            try {
              await openBlob(String(url))
            } finally {
              setOpening(false)
            }
          }}
          type="button"
        >
          <ArrowsPointingOutIcon aria-hidden="true" className="size-4" data-slot="icon" />
          {opening ? 'Opening…' : 'Open'}
        </button>
        <button
          aria-label="Download file"
          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white/90 px-2 py-1 text-xs font-medium text-zinc-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white active:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-700 dark:focus-visible:ring-blue-300/40"
          disabled={downloading}
          onClick={async function () {
            setDownloading(true)

            try {
              await downloadBlob(String(url), displayFilename(blob.cid, blob.mimeType))
            } finally {
              setDownloading(false)
            }
          }}
          type="button"
        >
          <ArrowDownTrayIcon aria-hidden="true" className="size-4" data-slot="icon" />
          {downloading ? 'Downloading…' : 'Download'}
        </button>
      </div>
      {value}
      {cells.length > 0 ? (
        <dl>
          {cells.map(({ key, value }) => (
            <div className="grid grid-cols-1 gap-1 py-1 md:grid-cols-4" key={key}>
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
 * Display a mime type.
 *
 * @param type
 *   Value from `content-type` header.
 * @returns
 *   Human-friendly file type.
 */
function displayFileType(type?: string | undefined): React.ReactNode {
  const label = type ? supportedMediaTypeLabels.get(type) : undefined
  return label || (type ? <Code>{type}</Code> : 'Unknown')
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
  const extension = type ? mediaTypeExtensions.get(type) : undefined
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
