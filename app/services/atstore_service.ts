import { readFile } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import cache from '@adonisjs/cache/services/main'
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
    return cache.getOrSet({
      factory: async () => {
        const filePath = app.makePath('data', 'apps.json')
        const local = await localAppsValidator.validate(
          JSON.parse(await readFile(filePath, 'utf8'))
        )
        const list = await Promise.all(
          local.map(async (localApp) => {
            const listing = await this.#fetchListing(localApp.atUri)
            return listing ? { ...listing, ...localApp } : undefined
          })
        )
        return list.filter((a): a is App => a !== undefined)
      },
      grace: '24h',
      key: 'atstore:apps',
      ttl: '4h',
    })
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
   *   Details, or `undefined` on failure.
   */
  async #fetchListing(atUri: string): Promise<AtStoreListingDetail | undefined> {
    const result = await xrpcSafe(this.baseUrl, lexicon.fyi.atstore.directory.getListing.main, {
      params: { uri: asAtUriString(atUri) },
    })

    if (!result.success) {
      console.warn(`[atstore] lookup failed for ${atUri}:`, result.error)
      return
    }

    // Only pick what’s wanted.
    const { externalUrl, listing } = result.body
    const { iconUrl, name, rating, reviewCount, tagline } = listing
    return { externalUrl, listing: { iconUrl, name, rating, reviewCount, tagline } }
  }
}
