import type { StorageCategory } from '#shared/storage'

/**
 * MIME type recognized as *displayable* images.
 */
export type ImageMimeType = (typeof images)[number]

/**
 * Known MIME types.
 */
export type KnownMimeType = ImageMimeType | VideoMimeType

/**
 * MIME type recognized as *displayable* videos.
 * The client side will still check with `canPlayType` if the browser
 * can actually show it in a `<video>`.
 */
export type VideoMimeType = (typeof videos)[number]

// Note: after changing mime types,
// run `node ace storage:recategorize` (on the server!)
// to reclassify existing blobs.
const images = ['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'] as const
const videos = ['video/mp4', 'video/ogg', 'video/webm'] as const

/**
 * Check whether a (normalized) MIME type is a displayable image.
 *
 * @param value
 *   Normalized MIME type.
 * @returns
 *   Whether it is a known image MIME type.
 */
export function isImageMimeType(value: unknown): value is ImageMimeType {
  return (images as ReadonlyArray<unknown>).includes(value)
}

/**
 * Check whether a (normalized) MIME type is a displayable video.
 *
 * @param value
 *   Normalized MIME type.
 * @returns
 *   Whether it is a known video MIME type.
 */
export function isKnownMimeType(value: unknown): value is KnownMimeType {
  return isImageMimeType(value) || isVideoMimeType(value)
}

/**
 * Check whether a (normalized) MIME type is a displayable video.
 *
 * @param value
 *   Normalized MIME type.
 * @returns
 *   Whether it is a known video MIME type.
 */
export function isVideoMimeType(value: unknown): value is VideoMimeType {
  return (videos as ReadonlyArray<unknown>).includes(value)
}

/**
 * Normalize a `content-type` value to a lowercase MIME type.
 *
 * @param value
 *   Raw `content-type` header value.
 * @returns
 *   Normalized MIME type.
 */
export function normalizeMimeType(value?: string | null | undefined): string {
  return (value || '').split(';')[0]?.trim().toLowerCase() ?? 'application/octet-stream'
}

/**
 * Check if something is displayable media.
 *
 * @param value
 *   Normalized MIME type.
 * @returns
 *   Media type.
 */
export function mediaType(value: unknown): StorageCategory {
  if (isImageMimeType(value)) {
    return 'image'
  }

  if (isVideoMimeType(value)) {
    return 'video'
  }

  return 'other'
}
