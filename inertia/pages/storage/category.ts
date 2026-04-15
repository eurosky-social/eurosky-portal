/**
 * Categories.
 */
export type FileCategory = 'image' | 'other' | 'video'

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
 * Video element for capability checks.
 */
const videoElement = typeof document !== 'undefined' ? document.createElement('video') : undefined

/**
 * Resolve a file category from MIME type.
 */
export function fileCategoryFromMimeType(value: string | undefined): FileCategory {
  const type = mediaType(normalizeMimeType(value ?? ''))

  if (type === 'image' || type === 'video') {
    return type
  }

  return 'other'
}

/**
 * Check if something is displayable media.
 *
 * @param type
 *   Content type.
 * @returns
 *   Media type.
 */
function mediaType(type: string): Exclude<FileCategory, 'other'> | undefined {
  if (allowedImages.has(type)) {
    return 'image'
  }

  if (allowedVideos.has(type) && videoElement && videoElement.canPlayType(type)) {
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
function normalizeMimeType(value?: string | undefined): string {
  return (value || '').split(';')[0]?.trim().toLowerCase() ?? 'application/octet-stream'
}
