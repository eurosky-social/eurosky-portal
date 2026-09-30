import { type AtUriParts, type AtUriString, AtUri, parseAtUriString } from '@atproto/syntax'
import { type AtTagUriParts, apps } from '#shared/apps'

/**
 * BlueSky hashtags don’t have a real `at://` URI representation,
 * but we do want to convert between them.
 * So this is a similar pseudo shape.
 */
export type AtTagUriString = `${typeof atTag}${string}`

type Choice = [atUri: AtUriString, url: string]
type Listener = () => undefined | void

const atTag = 'at-tag://'

/**
 * App to use when there is no recent pick or favorite.
 * Mu!
 */
const defaultApp = 'at://did:plc:izttpdp3l6vss5crelt5kcux/fyi.atstore.listing.detail/3mqmb7emiusy5'
const listeners = new Set<Listener>()

/**
 * Recent picks, as URIs of apps (atstore listings);
 * unknown values (such as app names, which were used before) are ignored.
 */
const localStorageKey = 'preferred-apps'

/**
 * Find apps that can open a given `at://` URI.
 *
 * @param atUri
 *   `at://` URI (example `at://did` or `at://did/collection/rkey`).
 * @returns
 *   URIs of apps (atstore listings) and web URLs.
 */
export function find(atUri: AtTagUriString | AtUriString): Array<Choice> {
  const result: Array<Choice> = []
  let parts: AtUriParts | AtTagUriParts | undefined

  if (atUri.startsWith(atTag)) {
    const tag = atUri.slice(atTag.length)
    if (tag) {
      try {
        parts = { tag: decodeURIComponent(tag) }
      } catch {}
    }
  } else {
    const parsed = parseAtUriString(atUri, { strict: false })
    if (parsed.success) parts = parsed.value
  }

  if (!parts) return result

  for (const app of apps) {
    if (!app.launcher) continue
    const url = app.launcher.fromAtUri(parts)
    if (url) result.push([app.atUri, url])
  }

  return result
}

/**
 * Parse a `useSyncExternalStore` snapshot value.
 *
 * Pure function of its input, so server and client render the same result
 * for the same snapshot value.
 *
 * @param value
 *   Snapshot value.
 * @returns
 *   List of preferred apps.
 */
function parse(value: string | null): ReadonlyArray<unknown> {
  if (value) {
    try {
      const result: unknown = JSON.parse(value)
      if (Array.isArray(result)) return result
    } catch {}
  }

  return []
}

/**
 * Get the preferred choice from a list of choices.
 *
 * Recent picks come first, then favorites, then {@linkcode defaultApp}.
 *
 * @param choices
 *   List of choices.
 * @param value
 *   Snapshot value (from `useSyncExternalStore`).
 * @param favorites
 *   URIs of favorited apps (atstore listings).
 * @returns
 *   Preferred choice.
 */
export function preferred(
  choices: ReadonlyArray<Choice>,
  value: string | null,
  favorites: ReadonlyArray<string> = []
): Choice | undefined {
  for (const app of parse(value)) {
    const choice = choices.find(([appUri]) => appUri === app)
    if (choice) return choice
  }

  const favorite = choices.find(([appUri]) => favorites.includes(appUri))
  if (favorite) return favorite

  return choices.find(([appUri]) => appUri === defaultApp) ?? choices.at(0)
}

/**
 * Prefer an app.
 *
 * Saves a unique list of newest preferred apps,
 * capped to a reasonable size.
 *
 * @param appUri
 *   URI of app (atstore listing).
 * @param value
 *   Current snapshot value (from `useSyncExternalStore`).
 * @returns
 *   Nothing.
 */
export function prefer(appUri: AtUriString, value: string | null): undefined {
  if (typeof localStorage === 'undefined') return

  const preferredApps = [...new Set([appUri, ...parse(value)])]
  if (preferredApps.length > 20) preferredApps.length = 20

  try {
    localStorage.setItem(localStorageKey, JSON.stringify(preferredApps))
  } catch {
    return
  }

  for (const listener of listeners) listener()
}

/**
 * Get a server snapshot for `useSyncExternalStore`.
 *
 * @returns
 *   Snapshot.
 */
export function serverSnapshot(): string | null {
  return null
}

/**
 * Get a client snapshot for `useSyncExternalStore`.
 *
 * @returns
 *   Snapshot.
 */
export function snapshot(): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    return localStorage.getItem(localStorageKey)
  } catch {
    return null
  }
}

/**
 * Subscribe to changes.
 *
 * @param listener
 *   Callback.
 * @returns
 *   Unsubscribe.
 */
export function subscribe(listener: Listener) {
  listeners.add(listener)

  return function (): undefined {
    listeners.delete(listener)
  }
}

/**
 * Inverse: try and turn some web url into an `at://` URI.
 *
 * @param webUrl
 *   Web URL.
 * @returns
 *   AT URI.
 */
export function toUri(href: string): AtTagUriString | AtUriString | undefined {
  let url: URL | undefined

  try {
    url = new URL(href)
  } catch {}

  if (!url) return
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return

  for (const app of apps) {
    if (!app.launcher) continue
    const parts = app.launcher.toAtUri(url)
    if (parts) {
      return 'tag' in parts
        ? `at-tag://${encodeURIComponent(parts.tag)}`
        : AtUri.make(parts.authority, parts.collection, parts.rkey).toString()
    }
  }
}
