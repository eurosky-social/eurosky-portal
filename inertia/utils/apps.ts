import { type AtUriParts, type AtUriString, parseAtUriString } from '@atproto/syntax'

type AppResult = [name: string, url: string]
type AppTransform = (parts: AtUriParts) => string | undefined
type App = [name: string, transform: AppTransform]

const localStorageKey = 'preferred-apps'

/**
 * List of supported apps and their URL transformation functions.
 */
const apps: ReadonlyArray<App> = [
  [
    'Bluesky',
    (parts) => {
      const base = `https://bsky.app/profile/${parts.authority}`
      if (!parts.collection) return base
      if (parts.collection === 'app.bsky.feed.post' && parts.rkey)
        return `${base}/post/${parts.rkey}`
    },
  ],
  [
    'Mu',
    (parts) => {
      const base = `https://mu.social/profile/${parts.authority}`
      if (!parts.collection) return base
      if (parts.collection === 'app.bsky.feed.post' && parts.rkey)
        return `${base}/post/${parts.rkey}`
    },
  ],
]

/**
 * Find apps that can open a given `at://` URI.
 *
 * @param atUri
 *   `at://` URI (example `at://did` or `at://did/collection/rkey`).
 * @returns
 *   App names and web URLs.
 */
export function find(atUri: AtUriString): Array<AppResult> {
  const result: Array<AppResult> = []
  const parsed = parseAtUriString(atUri, { strict: false })
  if (!parsed.success) return result
  for (const [name, transform] of apps) {
    const url = transform(parsed.value)
    if (url) result.push([name, url])
  }
  return result
}

/**
 * Read preferred apps.
 *
 * @returns
 *   List of preferred apps.
 */
function get(): ReadonlyArray<unknown> {
  const value = localStorage.getItem(localStorageKey)
  if (value) {
    try {
      const result: unknown = JSON.parse(value)
      if (Array.isArray(result)) return result
    } catch {}
  }
  return []
}

/**
 * Prefer an app.
 *
 * Saves a unique list of newest preferred apps,
 * capped to a reasonable size.
 *
 * @param name
 *   Name of app.
 * @returns
 *   Nothing.
 */
export function prefer(name: string): undefined {
  const preferred = [...new Set([name, ...get()])]
  if (preferred.length > 20) preferred.length = 20
  localStorage.setItem(localStorageKey, JSON.stringify(preferred))
}

/**
 * Sort apps.
 *
 * @param list
 *   List of apps.
 * @returns
 *   Sorted apps, preferred apps first then alphabetically.
 */
export function sort(list: ReadonlyArray<AppResult>): Array<AppResult> {
  const preferred = get()
  const sorted = [...list]
  sorted.sort(compareApp)
  return sorted

  function compareApp(left: AppResult, right: AppResult) {
    // Sort on preferred order first.
    const leftPosition = preferred.indexOf(left[0])
    const rightPosition = preferred.indexOf(right[0])
    if (leftPosition !== -1 && rightPosition !== -1) return leftPosition - rightPosition
    if (leftPosition !== -1 && rightPosition === -1) return -1
    if (leftPosition === -1 && rightPosition !== -1) return 1
    // Sort alphabetically.
    return left[0].localeCompare(right[0])
  }
}
