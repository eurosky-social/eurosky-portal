import { readFile } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import cache from '@adonisjs/cache/services/main'
import logger from '@adonisjs/core/services/logger'
import { xrpcSafe } from '@atproto/lex'
import { asAtUriString } from '@atproto/syntax'
import type { Infer } from '@vinejs/vine/types'
import vine from '@vinejs/vine'
import * as lexicon from '#lexicons'

const categories = ['getting-started', 'explore-more', 'for-work'] as const
export type Category = (typeof categories)[number]

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
  'iconUrl' | 'name' | 'rating' | 'reviewCount' | 'tagline'
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
  atUri: vine.string().startsWith('at://'),
  category: vine.enum(categories),
  madeInEU: vine.boolean().optional(),
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
   * Get apps from local `data/apps.json` and augment with remote info.
   */
  async getApps(): Promise<ReadonlyArray<App>> {
    const filePath = app.makePath('data', 'apps.json')
    const local = await localAppsValidator.validate(JSON.parse(await readFile(filePath, 'utf8')))
    const list = await Promise.allSettled(
      local.map((localApp) =>
        cache.getOrSet({
          factory: async () => {
            const listing = await this.#fetchListing(localApp.atUri)
            return { ...listing, ...localApp }
          },
          graceBackoff: '15m',
          grace: '24h',
          key: `atstore:listing:${localApp.atUri}`,
          ttl: '4h',
        })
      )
    )

    return list
      .map((result) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          logger.warn('Failed to fetch app listing', { error: result.reason })
        }
      })
      .filter((a): a is App => a !== undefined)
  }

  /**
   * Find apps by category.
   */
  findByCategory(apps: ReadonlyArray<App>, category: Category): Array<App> {
    return apps.filter((a) => a.category === category)
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
    const { iconUrl, name, rating, reviewCount, tagline } = listing
    return { externalUrl, listing: { iconUrl, name, rating, reviewCount, tagline } }
  }
}
