import { PhotoIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useState } from 'react'
import type { BlobLocator } from '#utils/embed'
import { toBlobCdnUrl, toBlobPdsUrl } from '~/utils/blob'
import { useImageLoadState } from '~/utils/use_image_load_state'

export function BlobImage({
  alt,
  blob,
  className,
}: {
  alt: string
  blob: BlobLocator
  className?: string
}) {
  const cdnUrl = toBlobCdnUrl(blob)
  const [src, setSrc] = useState(cdnUrl)
  const { imageLoadState, onLoad, onError } = useImageLoadState(src)

  if (imageLoadState === 'error') {
    return (
      <div
        aria-hidden={alt ? undefined : true}
        aria-label={alt || undefined}
        className={clsx(className, 'flex items-center justify-center bg-zinc-100 dark:bg-zinc-800')}
        role={alt ? 'img' : undefined}
      >
        <PhotoIcon className="size-1/4 text-zinc-400 dark:text-zinc-600" />
      </div>
    )
  }

  return (
    <img
      alt={alt}
      className={clsx(
        className,
        imageLoadState === 'loading' ? 'animate-pulse bg-zinc-200 dark:bg-zinc-800' : undefined
      )}
      onError={() => {
        // Try origin PDS if CDN fails.
        if (src === cdnUrl) {
          setSrc(toBlobPdsUrl(blob))
        } else {
          onError()
        }
      }}
      onLoad={onLoad}
      src={src}
    />
  )
}
