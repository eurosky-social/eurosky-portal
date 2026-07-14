import { useState } from 'react'
import type { BlobLocator } from '#utils/embed'
import { toBlobCdnUrl, toBlobPdsUrl } from '~/utils/blob'

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

  return (
    <img
      alt={alt}
      className={className}
      onError={() => setSrc((current) => (current === cdnUrl ? toBlobPdsUrl(blob) : current))}
      src={src}
    />
  )
}
