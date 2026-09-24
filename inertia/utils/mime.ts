import type { ReactNode } from 'react'
import { type KnownMimeType, isKnownMimeType } from '#shared/mime'
import type { T, TPlain } from '~/lib/i18n'

/**
 * MIME types to translation keys.
 */
const labels: Record<KnownMimeType, string> = {
  'image/avif': 'mimeType.avif',
  'image/gif': 'mimeType.gif',
  'image/jpeg': 'mimeType.jpeg',
  'image/png': 'mimeType.png',
  'image/webp': 'mimeType.webp',
  'video/mp4': 'mimeType.mp4',
  'video/ogg': 'mimeType.ogg',
  'video/webm': 'mimeType.webm',
}

/**
 * MIME types to file extensions;
 * needed to make files useful after downloading and showing in finder or so.
 */
const extensions: Record<KnownMimeType, string> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/ogg': 'ogv',
  'video/webm': 'webm',
}

/**
 * Format a MIME type for display.
 *
 * @param t
 *   Translation function; pass `tPlain` for a plain-string result (example:
 *   for use in an `aria-label`).
 * @param type
 *   MIME type (example: `image/png`).
 * @returns
 *   Human-readable label for a known type, or `type` otherwise.
 */
export function formatMimeType(t: TPlain, type: string): string
export function formatMimeType(t: T, type: string): ReactNode
export function formatMimeType(t: T | TPlain, type: string): ReactNode {
  return isKnownMimeType(type) ? t(labels[type]) : type
}

/**
 * Get the file extension for a MIME type, if known.
 *
 * @param type
 *   MIME type (example: `image/png`).
 * @returns
 *   File extension (example: `png`), or `undefined` when unknown.
 */
export function mimeTypeExtension(type: string): string | undefined {
  return isKnownMimeType(type) ? extensions[type] : undefined
}
