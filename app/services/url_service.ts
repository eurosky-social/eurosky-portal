import env from '#start/env'

/**
 * App URL, normalized to always have a trailing slash.
 */
const appUrl = new URL('/', env.get('APP_URL')).toString()

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
