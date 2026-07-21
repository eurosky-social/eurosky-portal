import {
  type AtUriParts,
  type AtUriString,
  AtUri,
  ifAtIdentifierString,
  parseAtUriString,
} from '@atproto/syntax'

/**
 * Hashtag.
 */
export interface AtTagUriParts {
  tag: string
}

/**
 * BlueSky hashtags don’t have a real `at://` URI representation,
 * but we do want to convert between them.
 * So this is a similar pseudo shape.
 */
export type AtTagUriString = `${typeof atTag}${string}`

type Choice = [name: string, url: string]
type FromAtUri = (parts: AtUriParts | AtTagUriParts) => string | undefined
type Listener = () => undefined | void
type ToAtUri = (url: URL) => AtUriParts | AtTagUriParts | undefined

const atTag = 'at-tag://'
const listeners = new Set<Listener>()
const localStorageKey = 'preferred-apps'

/**
 * List of supported apps and their URL transformation functions.
 */
const apps: ReadonlyArray<[name: string, fromAtUri: FromAtUri, toAtUri: ToAtUri]> = [
  [
    'Bluesky',
    (parts) => {
      if ('tag' in parts) return `https://bsky.app/hashtag/${encodeURIComponent(parts.tag)}`
      const base = `https://bsky.app/profile/${parts.authority}`
      if (!parts.collection) return base
      if (parts.collection === 'app.bsky.feed.post' && parts.rkey) {
        return `${base}/post/${parts.rkey}`
      }
    },
    (url) => {
      if (url.hostname !== 'bsky.app') return

      const hashtagMatch = /^\/hashtag\/([^/]+)\/?$/.exec(url.pathname)
      if (hashtagMatch) {
        try {
          return { tag: decodeURIComponent(hashtagMatch[1]) }
        } catch {
          return
        }
      }

      const profileMatch = /^\/profile\/([^/]+)(?:\/post\/([^/]+))?\/?$/.exec(url.pathname)
      if (!profileMatch) return
      const [, rawAuthority, rkey] = profileMatch
      const authority = rawAuthority ? ifAtIdentifierString(rawAuthority) : undefined
      if (!authority) return
      if (rkey) return { authority, collection: 'app.bsky.feed.post', rkey }
      return { authority }
    },
  ],
  [
    'Leaflet',
    (parts) => {
      if ('tag' in parts) return
      // Leaflet has user links, but we don’t return them.
      // `https://leaflet.pub/p/${parts.authority}`
      if (!parts.collection) return
      if (parts.collection === 'site.standard.document' && parts.rkey)
        return `https://leaflet.pub/p/${parts.authority}/${parts.rkey}`
    },
    (url) => {
      if (url.hostname !== 'leaflet.pub') return
      const match = /^\/p\/([^/]+)(?:\/([^/]+))?\/?$/.exec(url.pathname)
      if (!match) return
      const [, rawAuthority, rkey] = match
      const authority = rawAuthority ? ifAtIdentifierString(rawAuthority) : undefined
      if (!authority) return
      if (rkey) return { authority, collection: 'site.standard.document', rkey }
      return { authority }
    },
  ],
  [
    'Mu',
    (parts) => {
      if ('tag' in parts) return `https://mu.social/hashtag/${encodeURIComponent(parts.tag)}`
      const base = `https://mu.social/profile/${parts.authority}`
      if (!parts.collection) return base
      if (parts.collection === 'app.bsky.feed.post' && parts.rkey)
        return `${base}/post/${parts.rkey}`
    },
    (url) => {
      if (url.hostname !== 'mu.social') return

      const hashtagMatch = /^\/hashtag\/([^/]+)\/?$/.exec(url.pathname)
      if (hashtagMatch) {
        try {
          return { tag: decodeURIComponent(hashtagMatch[1]) }
        } catch {
          return
        }
      }

      const profileMatch = /^\/profile\/([^/]+)(?:\/post\/([^/]+))?\/?$/.exec(url.pathname)
      if (!profileMatch) return
      const [, rawAuthority, rkey] = profileMatch
      const authority = rawAuthority ? ifAtIdentifierString(rawAuthority) : undefined
      if (!authority) return
      if (rkey) return { authority, collection: 'app.bsky.feed.post', rkey }
      return { authority }
    },
  ],
  [
    'Standard reader',
    (parts) => {
      if ('tag' in parts) return
      // Leaflet has user links, but we don’t return them.
      // `https://standard-reader.app/u/${parts.authority}`
      if (!parts.collection) return
      if (parts.collection === 'site.standard.document' && parts.rkey)
        return `https://standard-reader.app/a/${parts.authority}/${parts.rkey}`
    },
    (url) => {
      if (url.hostname !== 'standard-reader.app') return

      const profile = /^\/u\/([^/]+)\/?$/.exec(url.pathname)
      const profileAuthority = profile?.[1] ? ifAtIdentifierString(profile[1]) : undefined
      if (profileAuthority) return { authority: profileAuthority }

      const article = /^\/a\/([^/]+)\/([^/]+)\/?$/.exec(url.pathname)
      const articleAuthority = article ? ifAtIdentifierString(article[1]) : undefined
      if (article && articleAuthority) {
        return {
          authority: articleAuthority,
          collection: 'site.standard.document',
          rkey: article[2],
        }
      }
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

  for (const [name, fromAtUri] of apps) {
    const url = fromAtUri(parts)
    if (url) result.push([name, url])
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

  // Prefer Mu :)
  return ['Mu']
}

/**
 * Get the preferred choice from a list of choices.
 *
 * @param choices
 *   List of choices.
 * @param value
 *   Snapshot value (from `useSyncExternalStore`).
 * @returns
 *   Preferred choice.
 */
export function preferred(
  choices: ReadonlyArray<Choice>,
  value: string | null
): Choice | undefined {
  const preferredApps = parse(value)

  for (const app of preferredApps) {
    const choice = choices.find(([name]) => name === app)
    if (choice) return choice
  }

  return choices.at(0)
}

/**
 * Prefer an app.
 *
 * Saves a unique list of newest preferred apps,
 * capped to a reasonable size.
 *
 * @param name
 *   Name of app.
 * @param value
 *   Current snapshot value (from `useSyncExternalStore`).
 * @returns
 *   Nothing.
 */
export function prefer(name: string, value: string | null): undefined {
  if (typeof localStorage === 'undefined') return

  const preferredApps = [...new Set([name, ...parse(value)])]
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

  for (const [, , toAtUri] of apps) {
    const parts = toAtUri(url)
    if (parts) {
      return 'tag' in parts
        ? `at-tag://${encodeURIComponent(parts.tag)}`
        : AtUri.make(parts.authority, parts.collection, parts.rkey).toString()
    }
  }
}
