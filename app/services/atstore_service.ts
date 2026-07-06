import { readFile } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import cache from '@adonisjs/cache/services/main'
import logger from '@adonisjs/core/services/logger'
import { xrpcSafe } from '@atproto/lex'
import { AtUri, asAtUriString } from '@atproto/syntax'
import type { Infer } from '@vinejs/vine/types'
import vine from '@vinejs/vine'
import * as lexicon from '#lexicons'

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
 * The fields that we add onto `atstore.fyi`.
 * These are defined in `data/apps.json`.
 *
 * Look at the existing data to add more.
 * Then search the atstore for an app.
 * For example, `https://atstore.fyi/xrpc/fyi.atstore.directory.searchListings?q=sifa`
 * for `sifa`.
 * Use the `at://…` url you see there as the `atUri` in `data/apps.json`.
 */
const localAppSchema = vine.object({
  /**
   * Human-readable label for the entry; not used other than to make logs more
   * readable.
   */
  '#': vine.string().optional(),

  /**
   * URI to atstore.
   */
  'atUri': vine.string().startsWith('at://'),

  /**
   * Category slug (example: `getting-started`).
   */
  'category': vine.string().trim().minLength(1),

  /**
   * Apps to show “outside” of the `apps` page.
   */
  'featured': vine.boolean().optional(),

  /**
   * Stamp of approval.
   */
  'madeInEurope': vine.boolean().optional(),

  /**
   * Custom category: apps recommended by eurosky.
   */
  'recommended': vine.boolean().optional(),
})

const localAppsValidator = vine.create(vine.array(localAppSchema))

type LocalApp = Infer<typeof localAppSchema>
export interface App extends AtStoreListingDetail, LocalApp {}

export class AtStoreService {
  /**
   * Base for API calls.
   */
  private baseUrl = 'https://atstore.fyi'

  /**
   * Get all local apps and augment with remote info.
   */
  async getApps(): Promise<ReadonlyArray<App>> {
    return this.#hydrateAll(await this.#getLocalApps())
  }

  /**
   * Get local apps flagged as `featured` and augmented with remote info.
   */
  async getFeaturedApps(): Promise<ReadonlyArray<App>> {
    const local = await this.#getLocalApps()
    return this.#hydrateAll(local.filter((a) => a.featured))
  }

  /**
   * Get an app by record key.
   */
  async getApp(rkey: string): Promise<App | undefined> {
    const local = await this.#getLocalApps()
    const localApp = local.find((a) => new AtUri(a.atUri).rkey === rkey)
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
      externalUrl,
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
   * Read and validate local apps from `data/apps.json`.
   */
  async #getLocalApps(): Promise<ReadonlyArray<LocalApp>> {
    const filePath = app.makePath('data', 'apps.json')
    return localAppsValidator.validate(JSON.parse(await readFile(filePath, 'utf8')))
  }

  /**
   * Augment apps with remote info.
   *
   * Skips and logs any that fail.
   */
  async #hydrateAll(local: ReadonlyArray<LocalApp>): Promise<ReadonlyArray<App>> {
    const list = await Promise.allSettled(local.map((localApp) => this.#hydrate(localApp)))

    return list
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          const localApp = local[index]
          const label = localApp['#'] ?? localApp.atUri
          logger.warn({ error: result.reason }, `Failed to fetch listing \`${label}\``)
        }
      })
      .filter((a): a is App => a !== undefined)
  }

  /**
   * Augment an app with remote info.
   */
  async #hydrate(localApp: LocalApp): Promise<App> {
    return cache.getOrSet({
      factory: async () => {
        const listing = await this.#fetchListing(localApp.atUri)
        return { ...listing, ...localApp }
      },
      graceBackoff: '15m',
      grace: '24h',
      key: `atstore:listing:${localApp.atUri}`,
      ttl: '4h',
    })
  }
}
