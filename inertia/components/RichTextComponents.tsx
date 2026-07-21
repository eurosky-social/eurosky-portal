import type { ExtraProps } from 'hast-util-to-jsx-runtime'
import { useSyncExternalStore } from 'react'
import { BlobImage } from '~/components/BlobImage'
import { find, preferred, serverSnapshot, snapshot, subscribe, toUri } from '~/utils/apps'

type ImageProperties = React.JSX.IntrinsicElements['img'] & ExtraProps

export function a(properties: React.JSX.IntrinsicElements['a'] & ExtraProps) {
  const { node, ...rest } = properties

  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot)

  // Normalize URLs into `at://` URIs, and then use the preferred app to launch those.
  let href = rest.href
  const atUri = href ? toUri(href) : undefined
  const choice = atUri ? preferred(find(atUri), value) : undefined
  if (choice) href = choice[1]

  return (
    <a
      {...rest}
      className="text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400 dark:decoration-blue-400/30 dark:hover:decoration-blue-400"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    />
  )
}

export function img(properties: ImageProperties) {
  const { node, ...rest } = properties
  const data = node?.data ?? {}
  const { blobCid: cid, blobDid: did, blobPds: pds } = data

  return typeof cid === 'string' && typeof did === 'string' && typeof pds === 'string' ? (
    <BlobImage {...rest} blob={{ cid, did, pds }} className="rounded-lg object-cover" />
  ) : (
    <img {...rest} />
  )
}
