import type { BlobLocator } from '#utils/embed'

/**
 * URL to blob on Bluesky CDN.
 *
 * @returns
 *   URL to blob.
 */
export function toBlobCdnUrl(blob: BlobLocator): string {
  return `https://cdn.bsky.app/img/feed_thumbnail/plain/${blob.did}/${blob.cid}@jpeg`
}

/**
 * URL to blob on the PDS that hosts it.
 *
 * @returns
 *   URL to blob.
 */
export function toBlobPdsUrl(blob: BlobLocator): string {
  const url = new URL('/xrpc/com.atproto.sync.getBlob', blob.pds)
  url.searchParams.set('cid', blob.cid)
  url.searchParams.set('did', blob.did)
  return url.toString()
}
