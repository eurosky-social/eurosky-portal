import { useSyncExternalStore } from 'react'

type Listener = () => undefined | void

/**
 * Store for one media query.
 */
interface MediaQueryStore {
  /**
   * Get a client snapshot for `useSyncExternalStore`:
   * whether the query matches.
   */
  snapshot(): boolean

  /**
   * Subscribe to changes.
   */
  subscribe(listener: Listener): () => undefined
}

/**
 * Stores by query, so that each query has one `MediaQueryList` and one
 * `change` listener, however many components use it.
 */
const stores = new Map<string, MediaQueryStore>()

/**
 * Get the shared store for a media query.
 *
 * @param query
 *   Media query (such as `(prefers-reduced-data: reduce)`).
 * @returns
 *   Store.
 */
export function mediaQuery(query: string): MediaQueryStore {
  let store = stores.get(query)

  if (!store) {
    store = createStore(query)
    stores.set(query, store)
  }

  return store
}

/**
 * Whether a media query matches, updating when it changes.
 *
 * @param query
 *   Media query (such as `(prefers-reduced-data: reduce)`).
 * @param serverValue
 *   Value to use on the server and while hydrating.
 * @returns
 *   Whether the query matches.
 */
export function useMediaQuery(query: string, serverValue: boolean): boolean {
  const { snapshot, subscribe } = mediaQuery(query)
  return useSyncExternalStore(subscribe, snapshot, () => serverValue)
}

/**
 * @param query
 *   Media query.
 * @returns
 *   Store.
 */
function createStore(query: string): MediaQueryStore {
  const listeners = new Set<Listener>()
  let media: MediaQueryList | undefined

  return { snapshot, subscribe }

  function snapshot(): boolean {
    return list().matches
  }

  function subscribe(listener: Listener): () => undefined {
    if (listeners.size === 0) list().addEventListener('change', onChange)
    listeners.add(listener)

    return function (): undefined {
      listeners.delete(listener)
      if (listeners.size === 0) list().removeEventListener('change', onChange)
    }
  }

  function onChange(): undefined {
    for (const listener of listeners) listener()
  }

  function list(): MediaQueryList {
    media ??= window.matchMedia(query)
    return media
  }
}
