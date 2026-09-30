import cache from '@adonisjs/cache/services/main'
import logger from '@adonisjs/core/services/logger'
import { type AtUriString, xrpcSafe } from '@atproto/lex'
import { AtUri, asAtUriString } from '@atproto/syntax'
import * as lexicon from '#lexicons'
import { type CatalogApp, apps } from '#shared/apps'

type ListingCardGet = lexicon.fyi.atstore.directory.getListing.ListingCardGet

/**
 * Plucked app listing detail (see `ListingDetailResponse`).
 */
interface AtStoreListingDetail {
  /**
   * Website (example: `'https://sifa.id/'`)
   */
  externalUrl?: string | undefined

  /**
   * Listing.
   */
  listing: AtStoreListing
}

/**
 * Plucked app listing.
 */
type AtStoreListing = Pick<
  ListingCardGet,
  | 'appTags'
  | 'categorySlug'
  | 'description'
  | 'heroImageUrl'
  | 'iconUrl'
  | 'name'
  | 'rating'
  | 'reviewCount'
  | 'tagline'
>

/**
 * App from our catalog (`shared/apps.ts`), augmented with remote info.
 */
export interface App extends AtStoreListingDetail, CatalogApp {}

/**
 * What the “open with” launcher needs to know about a catalog app.
 */
export type LauncherApp = {
  /**
   * URI of the atstore listing.
   */
  atUri: AtUriString

  /**
   * Whether the user favorited it.
   */
  favorite: boolean

  /**
   * Icon.
   */
  iconUrl: string | null

  /**
   * Name.
   */
  name: string
}

export class AtStoreService {
  /**
   * Base for API calls.
   */
  private baseUrl = 'https://atstore.fyi'

  /**
   * Get all local apps and augment with remote info.
   */
  async getApps(): Promise<ReadonlyArray<App>> {
    return this.#hydrateAll(apps)
  }

  /**
   * Get local apps flagged as `featured` and augmented with remote info.
   */
  async getFeaturedApps(): Promise<ReadonlyArray<App>> {
    return this.#hydrateAll(apps.filter((a) => a.featured))
  }

  /**
   * Get apps the “open with” launcher can use.
   *
   * @param favorites
   *   URIs of favorited apps.
   * @returns
   *   Apps.
   */
  async getLauncherApps(favorites: ReadonlyArray<string>): Promise<Array<LauncherApp>> {
    const favoriteSet = new Set<string>(favorites)
    const hydrated = await this.getApps()

    return hydrated
      .filter((app) => app.launcher)
      .map((app) => ({
        atUri: app.atUri,
        favorite: favoriteSet.has(app.atUri),
        iconUrl: app.listing.iconUrl,
        name: app.listing.name,
      }))
  }

  /**
   * Get an app by record key.
   */
  async getApp(rkey: string): Promise<App | undefined> {
    const localApp = apps.find((a) => new AtUri(a.atUri).rkey === rkey)
    if (!localApp) return
    return this.#hydrate(localApp)
  }

  /**
   * Fetch details from `atstore.fyi`.
   *
   * @param atUri
   *   URL of the listing (example: `at://did:plc:…/fyi.atstore.listing.detail/…c6y`).
   * @returns
   *   Details.
   */
  async #fetchListing(atUri: string): Promise<AtStoreListingDetail> {
    const result = await xrpcSafe(this.baseUrl, lexicon.fyi.atstore.directory.getListing.main, {
      params: { uri: asAtUriString(atUri) },
      signal: AbortSignal.timeout(5000),
    })

    if (!result.success) {
      throw new Error(`Failed to fetch listing ${atUri}`, { cause: result.error })
    }

    // Only pick what’s wanted.
    const { externalUrl, listing } = result.body
    const {
      appTags,
      categorySlug,
      description,
      heroImageUrl,
      iconUrl,
      name,
      rating,
      reviewCount,
      tagline,
    } = listing
    return {
      externalUrl: externalUrl ?? undefined,
      listing: {
        appTags,
        categorySlug,
        description,
        heroImageUrl,
        iconUrl,
        name,
        rating,
        reviewCount,
        tagline,
      },
    }
  }

  /**
   * Augment apps with remote info.
   *
   * Skips and logs any that fail.
   */
  async #hydrateAll(local: ReadonlyArray<CatalogApp>): Promise<ReadonlyArray<App>> {
    const list = await Promise.allSettled(local.map((localApp) => this.#hydrate(localApp)))

    return list
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          logger.warn({ err: result.reason }, `Failed to fetch listing \`${local[index].atUri}\``)
        }
      })
      .filter((a): a is App => a !== undefined)
  }

  /**
   * Augment an app with remote info.
   */
  async #hydrate(localApp: CatalogApp): Promise<App> {
    const listing = await cache.getOrSet({
      factory: () => this.#fetchListing(localApp.atUri),
      graceBackoff: '15m',
      grace: '24h',
      key: `atstore:listing:${localApp.atUri}`,
      ttl: '4h',
    })
    return { ...listing, ...localApp }
  }
}
