import cache from '@adonisjs/cache/services/main'
import { type AtUriString, XrpcResponseError } from '@atproto/lex'
import { currentDatetimeString } from '@atproto/syntax'
import type { AtprotoUser } from '@thisismissem/adonisjs-atproto-oauth'
import * as lexicon from '#lexicons'

/**
 * Favorite record.
 */
interface Favorite {
  /**
   * Key.
   */
  rkey: string

  /**
   * URI of the favorited atstore listing.
   */
  subject: AtUriString
}

/**
 * What to do.
 */
export type FavoriteAction = 'favorite' | 'unfavorite'

/**
 * Intent stored in the session while going through OAuth.
 */
export interface FavoriteIntent {
  action: FavoriteAction
  did: string
  subject: AtUriString
}

/**
 * Max to read per user.
 */
const maxFavorites = 1000

/**
 * Read and write atstore favorites (`fyi.atstore.listing.favorite`) in the
 * repo of the current user.
 */
export class FavoriteService {
  /**
   * Favorite an app;
   * does nothing if already favorited.
   *
   * @param user
   *   User.
   * @param subject
   *   URI of an atstore listing.
   * @returns
   *   Promise that resolves when done.
   * @throws
   *   {@linkcode XrpcResponseError} when the PDS rejects;
   *   see {@linkcode isScopeMissingError}.
   */
  async favorite(user: AtprotoUser, subject: AtUriString): Promise<undefined> {
    const favorites = await this.#list(user)

    if (!favorites.some((favorite) => favorite.subject === subject)) {
      await user.client.create(lexicon.fyi.atstore.listing.favorite.main, {
        createdAt: currentDatetimeString(),
        subject,
      })
    }

    await cache.delete({ key: cacheKey(user) })
  }

  /**
   * Get URIs of atstore listings the user favorited, with cache.
   *
   * @param user
   *   User.
   * @returns
   *   Unique subjects.
   */
  async getFavorites(user: AtprotoUser): Promise<Array<AtUriString>> {
    const favorites = await cache.getOrSet({
      factory: () => this.#list(user),
      grace: '10m',
      key: cacheKey(user),
      ttl: '10m',
    })

    return [...new Set(favorites.map((favorite) => favorite.subject))]
  }

  /**
   * Unfavorite an app;
   * removes all favorites of it.
   *
   * @param user
   *   User.
   * @param subject
   *   URI of an atstore listing.
   * @returns
   *   Promise that resolves when done.
   * @throws
   *   {@linkcode XrpcResponseError} when the PDS rejects;
   *   see {@linkcode isScopeMissingError}.
   */
  async unfavorite(user: AtprotoUser, subject: AtUriString): Promise<undefined> {
    const favorites = await this.#list(user)

    for (const favorite of favorites) {
      if (favorite.subject === subject) {
        await user.client.delete(lexicon.fyi.atstore.listing.favorite.main, { rkey: favorite.rkey })
      }
    }

    await cache.delete({ key: cacheKey(user) })
  }

  /**
   * List favorites, w/o cache.
   *
   * @param user
   *   User.
   * @returns
   *   Favorites.
   */
  async #list(user: AtprotoUser): Promise<Array<Favorite>> {
    const favorites: Array<Favorite> = []
    let cursor: string | undefined

    do {
      const result = await user.client.list(lexicon.fyi.atstore.listing.favorite.main, {
        cursor,
        limit: 100,
        signal: AbortSignal.timeout(5000),
      })

      if (result.records.length === 0) break

      for (const { uri, value } of result.records) {
        if (!lexicon.fyi.atstore.listing.favorite.$matches(value)) continue
        const rkey = uri.split('/').pop()!
        favorites.push({ rkey, subject: value.subject })
      }

      cursor = result.cursor
    } while (cursor && favorites.length < maxFavorites)

    return favorites
  }
}

/**
 * @param user
 *   User.
 * @returns
 *   Cache key.
 */
function cacheKey(user: AtprotoUser): string {
  return `favorites:${user.did}`
}

/**
 * @param error
 *   Error.
 * @returns
 *   Whether `error` is because the OAuth session misses a scope.
 */
export function isScopeMissingError(error: unknown): boolean {
  return error instanceof XrpcResponseError && error.error === 'ScopeMissingError'
}
