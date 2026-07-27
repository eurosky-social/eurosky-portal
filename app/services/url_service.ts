import { appUrl as rawAppUrl } from '#config/app'

/**
 * App URL, normalized to always have a trailing slash.
 */
export const appUrl = new URL('/', rawAppUrl).toString()

/**
 * App host (without protocol or port), as used by third parties such as Plausible.
 */
export const appHost = new URL(appUrl).hostname

/**
 * Resolve `path` to an absolute URL under {@linkcode appUrl}.
 */
export function toAbsoluteUrl(path = '/'): string {
  return new URL(path, appUrl).toString()
}
