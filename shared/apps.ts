import { type AtUriParts, type AtUriString, ifAtIdentifierString } from '@atproto/syntax'

/**
 * Hashtag.
 */
export interface AtTagUriParts {
  tag: string
}

/**
 * App in our catalog;
 * more info (name, icon, description) is fetched from `atstore.fyi`.
 *
 * To add one,
 * search the atstore for an app
 * (for example,
 * `https://atstore.fyi/xrpc/fyi.atstore.directory.searchListings?q=sifa`),
 * and use the `at://…` URI you see there as `atUri`.
 */
export interface CatalogApp {
  /**
   * URI of the atstore listing.
   */
  atUri: AtUriString

  /**
   * Category message key (example: `apps.category.events`);
   * apps w/o category are hidden from lists,
   * but still have a detail page and can be used by the “open with” launcher.
   */
  category?: string | undefined

  /**
   * Whether to show the app “outside” of the apps page.
   */
  featured?: boolean | undefined

  /**
   * How the “open with” launcher opens things in this app.
   */
  launcher?: Launcher | undefined

  /**
   * Stamp of approval.
   */
  madeInEurope?: boolean | undefined

  /**
   * Custom category: apps recommended by eurosky.
   */
  recommended?: boolean | undefined
}

/**
 * Turn `at://` URI parts into a web URL for an app, if it supports them.
 */
export type FromAtUri = (parts: AtUriParts | AtTagUriParts) => string | undefined

/**
 * How the “open with” launcher opens things in an app.
 */
interface Launcher {
  /**
   * Turn `at://` URI parts into a web URL of this app.
   */
  fromAtUri: FromAtUri

  /**
   * Turn a web URL of this app into `at://` URI parts.
   */
  toAtUri: ToAtUri
}

/**
 * Turn a web URL of an app into `at://` URI parts, if it is one.
 */
export type ToAtUri = (url: URL) => AtUriParts | AtTagUriParts | undefined

/**
 * Catalog.
 */
export const apps: ReadonlyArray<CatalogApp> = [
  // atmo.rsvp
  {
    atUri: 'at://did:plc:b63bmauox6z5rbibwrhxrdnw/fyi.atstore.listing.detail/3moebodfjt2oq',
    category: 'apps.category.events',
    madeInEurope: true,
    recommended: true,
  },
  // Atstore
  {
    atUri: 'at://did:plc:dvy6bdnofdfc4php4s5b457d/fyi.atstore.listing.detail/3mkjss6n7vuza',
    category: 'apps.category.reviews',
  },
  // Blento
  {
    atUri: 'at://did:plc:4fdwezqvlw4mu2qwn7wqsmej/fyi.atstore.listing.detail/3mkk4kacxbk3a',
    category: 'apps.category.personalPage',
    featured: true,
    madeInEurope: true,
  },
  // Bluesky
  {
    atUri: 'at://did:plc:dvy6bdnofdfc4php4s5b457d/fyi.atstore.listing.detail/3mj667g65ct2x',
    launcher: {
      fromAtUri: (parts) => {
        if ('tag' in parts) return `https://bsky.app/hashtag/${encodeURIComponent(parts.tag)}`
        const base = `https://bsky.app/profile/${parts.authority}`
        if (!parts.collection) return base
        if (parts.collection === 'app.bsky.feed.post' && parts.rkey) {
          return `${base}/post/${parts.rkey}`
        }
      },
      toAtUri: (url) => {
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
    },
  },
  // Bookhive
  {
    atUri: 'at://did:plc:enu2j5xjlqsjaylv3du4myh4/fyi.atstore.listing.detail/3mkigtshwosb3',
    category: 'apps.category.reviews',
  },
  // Cartes.app
  {
    atUri: 'at://did:plc:eypg6v3q62jkpoxbgicirvjs/fyi.atstore.listing.detail/3mnhhgryggkoj',
    category: 'apps.category.reviews',
    madeInEurope: true,
  },
  // Chive
  {
    atUri: 'at://did:plc:7natp5xae72bddaqlkef2t4e/fyi.atstore.listing.detail/3mkkxgeomikmf',
    category: 'apps.category.readWrite',
  },
  // Colibri
  {
    atUri: 'at://did:plc:mprdjqjluoswa7awzggaggj3/fyi.atstore.listing.detail/3mkiem5w5k2l6',
    category: 'apps.category.social',
    madeInEurope: true,
  },
  // Currents
  {
    atUri: 'at://did:plc:jaur46k6ijyfvl4lojza7eic/fyi.atstore.listing.detail/3mkl2pbqle2p6',
    category: 'apps.category.photoVideo',
    madeInEurope: true,
  },
  // Flashes
  {
    atUri: 'at://did:plc:24kqkpfy6z7avtgu3qg57vvl/fyi.atstore.listing.detail/3mkizzu7lp2a3',
    category: 'apps.category.photoVideo',
    madeInEurope: true,
    recommended: true,
  },
  // Germ
  {
    atUri: 'at://did:plc:4yvwfwxfz5sney4twepuzdu7/fyi.atstore.listing.detail/3ml2bxdff2kv7',
    category: 'apps.category.social',
  },
  // Glean
  {
    atUri: 'at://did:plc:7fx3svzgnlvzighbczz3mmsd/fyi.atstore.listing.detail/3mklb6venl2dg',
    category: 'apps.category.readWrite',
  },
  // Grain
  {
    atUri: 'at://did:plc:e7rftrdyz5e2rw4y6ocszew2/fyi.atstore.listing.detail/3mkinhlyjfk55',
    category: 'apps.category.photoVideo',
    recommended: true,
  },
  // Kimbia
  {
    atUri: 'at://did:plc:gktrthagvfvzkotyr3n2foox/fyi.atstore.listing.detail/3mtpahouumsbs',
    category: 'apps.category.sport',
    madeInEurope: true,
  },
  // kipclip
  {
    atUri: 'at://did:plc:3zzkrrjtsmo7nnwnvhex3auj/fyi.atstore.listing.detail/3mkip5bumt2p5',
    category: 'apps.category.bookmark',
  },
  // Leaflet
  {
    atUri: 'at://did:plc:btxrwcaeyodrap5mnjw2fvmz/fyi.atstore.listing.detail/3mkijfr6sts5l',
    category: 'apps.category.readWrite',
    launcher: {
      fromAtUri: (parts) => {
        if ('tag' in parts) return
        // Leaflet has user links, but we don’t return them.
        // `https://leaflet.pub/p/${parts.authority}`
        if (!parts.collection) return
        if (parts.collection === 'site.standard.document' && parts.rkey)
          return `https://leaflet.pub/p/${parts.authority}/${parts.rkey}`
      },
      toAtUri: (url) => {
        if (url.hostname !== 'leaflet.pub') return
        const match = /^\/p\/([^/]+)(?:\/([^/]+))?\/?$/.exec(url.pathname)
        if (!match) return
        const [, rawAuthority, rkey] = match
        const authority = rawAuthority ? ifAtIdentifierString(rawAuthority) : undefined
        if (!authority) return
        if (rkey) return { authority, collection: 'site.standard.document', rkey }
        return { authority }
      },
    },
  },
  // Margin
  {
    atUri: 'at://did:plc:rjqn3agdb74cszhqcpii4sne/fyi.atstore.listing.detail/3mkid4nadskrz',
    category: 'apps.category.bookmark',
  },
  // Marque
  {
    atUri: 'at://did:plc:nckosudltxrtrjkt4zz4jy5y/fyi.atstore.listing.detail/3mlweswilzk3p',
    category: 'apps.category.development',
  },
  // Mu
  {
    atUri: 'at://did:plc:izttpdp3l6vss5crelt5kcux/fyi.atstore.listing.detail/3mqmb7emiusy5',
    category: 'apps.category.social',
    featured: true,
    launcher: {
      fromAtUri: (parts) => {
        if ('tag' in parts) return `https://mu.social/hashtag/${encodeURIComponent(parts.tag)}`
        const base = `https://mu.social/profile/${parts.authority}`
        if (!parts.collection) return base
        if (parts.collection === 'app.bsky.feed.post' && parts.rkey)
          return `${base}/post/${parts.rkey}`
      },
      toAtUri: (url) => {
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
    },
    madeInEurope: true,
    recommended: true,
  },
  // npmx
  {
    atUri: 'at://did:plc:u5zp7npt5kpueado77kuihyz/fyi.atstore.listing.detail/3mknyydlui2jc',
    category: 'apps.category.development',
    madeInEurope: true,
  },
  // Offprint
  {
    atUri: 'at://did:plc:pgjkomf37an4czloay5zeth6/fyi.atstore.listing.detail/3mkni5k5q5kxx',
    category: 'apps.category.readWrite',
  },
  // pckt
  {
    atUri: 'at://did:plc:revjuqmkvrw6fnkxppqtszpv/fyi.atstore.listing.detail/3mkkyjyup6kdv',
    category: 'apps.category.readWrite',
    featured: true,
    recommended: true,
  },
  // Popfeed
  {
    atUri: 'at://did:plc:dvy6bdnofdfc4php4s5b457d/fyi.atstore.listing.detail/3mj66fhgmnh2x',
    category: 'apps.category.reviews',
    recommended: true,
  },
  // Semble
  {
    atUri: 'at://did:plc:k7wclckeajmuibxbamtbejjg/fyi.atstore.listing.detail/3mkiitkc44spk',
    category: 'apps.category.bookmark',
  },
  // Sifa ID
  {
    atUri: 'at://did:plc:2f2ahswozqy4v5lvu676375y/fyi.atstore.listing.detail/3mkduyazhqc6y',
    category: 'apps.category.personalPage',
    madeInEurope: true,
    recommended: true,
  },
  // Sill
  {
    atUri: 'at://did:plc:ryed5tnzwmpwbidrsuwrlwwb/fyi.atstore.listing.detail/3mkkdlphhxkgj',
    category: 'apps.category.readWrite',
    recommended: true,
  },
  // Skeets
  {
    atUri: 'at://did:plc:dvy6bdnofdfc4php4s5b457d/fyi.atstore.listing.detail/3mj66gqhdkq2f',
    category: 'apps.category.social',
    madeInEurope: true,
  },
  // Skylights
  {
    atUri: 'at://did:plc:4adlzwqtkv4dirxjwq4c3tlm/fyi.atstore.listing.detail/3mknw3yzlz2bp',
    category: 'apps.category.photoVideo',
  },
  // Skywalker
  {
    atUri: 'at://did:plc:zzmeflm2wzrrgcaam6bw3kaf/fyi.atstore.listing.detail/3mkpls2aa62c3',
    category: 'apps.category.social',
    madeInEurope: true,
  },
  // Smoke signal
  {
    atUri: 'at://did:plc:dvy6bdnofdfc4php4s5b457d/fyi.atstore.listing.detail/3mj66hobtig2d',
    category: 'apps.category.events',
  },
  // Spark
  {
    atUri: 'at://did:plc:cveom2iroj3mt747sd4qqnr2/fyi.atstore.listing.detail/3mkqg5sf3gsde',
    category: 'apps.category.photoVideo',
  },
  // Standard reader
  {
    atUri: 'at://did:plc:f4os2wz5fjl56xpwcvtnqu7m/fyi.atstore.listing.detail/3mpjb3fty62nt',
    category: 'apps.category.readWrite',
    launcher: {
      fromAtUri: (parts) => {
        if ('tag' in parts) return
        // Leaflet has user links, but we don’t return them.
        // `https://standard-reader.app/u/${parts.authority}`
        if (!parts.collection) return
        if (parts.collection === 'site.standard.document' && parts.rkey)
          return `https://standard-reader.app/a/${parts.authority}/${parts.rkey}`
      },
      toAtUri: (url) => {
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
    },
    recommended: true,
  },
  // Stream.place
  {
    atUri: 'at://did:plc:rbvrr34edl5ddpuwcubjiost/fyi.atstore.listing.detail/3mkijapfmwcvs',
    category: 'apps.category.photoVideo',
  },
  // Tangled
  {
    atUri: 'at://did:plc:dvy6bdnofdfc4php4s5b457d/fyi.atstore.listing.detail/3mj66idq2fp2t',
    category: 'apps.category.development',
    madeInEurope: true,
  },
  // Wisp
  {
    atUri: 'at://did:plc:7puq73yz2hkvbcpdhnsze2qw/fyi.atstore.listing.detail/3mkqaxwdkz2mp',
    category: 'apps.category.development',
  },
]
