import logger from '@adonisjs/core/services/logger'
import cache from '@adonisjs/cache/services/main'
import { type AtUriString, type l, xrpcSafe } from '@atproto/lex'
import { Monocle } from '@monocle.sh/adonisjs-agent'
import * as lexicon from '#lexicons'

export type BskyAppProfile = Pick<
  lexicon.app.bsky.actor.defs.ProfileViewDetailed,
  'avatar' | 'displayName' | 'handle'
>

export type BskyAppPost = {
  author: Pick<lexicon.app.bsky.actor.defs.ProfileViewBasic, 'avatar' | 'displayName' | 'handle'>
  text: string | undefined
}

/**
 * Read public and unauthenticated data from the public Bluesky API.
 */
export class BskyAppService {
  private baseUrl = 'https://public.api.bsky.app'

  /**
   * Get a profile (`app.bsky.actor.getProfile`) with cache.
   *
   * @param did
   *   DID.
   * @returns
   *   Profile.
   */
  async getProfile(did: l.DidString) {
    return cache.getOrSet({
      factory: (ctx) => this.#getProfile(did).then((r) => r ?? ctx.skip()),
      grace: '10m',
      key: `bsky-app-profile:${did}`,
      ttl: '10m',
    })
  }

  /**
   * Get a post (`app.bsky.feed.getPosts`) with cache.
   *
   * @param uri
   *   `at://` URI.
   * @returns
   *   Post.
   */
  async getPost(uri: AtUriString) {
    return cache.getOrSet({
      factory: (ctx) => this.#getPost(uri).then((r) => r ?? ctx.skip()),
      grace: '10m',
      key: `bsky-app-post:${uri}`,
      ttl: '10m',
    })
  }

  async #getProfile(did: l.DidString): Promise<BskyAppProfile | undefined> {
    const result = await xrpcSafe(this.baseUrl, lexicon.app.bsky.actor.getProfile.main, {
      params: { actor: did },
      signal: AbortSignal.timeout(1000),
    })

    if (!result.success) {
      logger.error(result, 'Invalid response from Bluesky App')
      Monocle.captureException(result, {
        extra: { did },
        tags: { component: 'bsky_app_service' },
      })
      return
    }

    const { avatar, displayName, handle } = result.body
    return { avatar, displayName, handle }
  }

  async #getPost(uri: AtUriString): Promise<BskyAppPost | undefined> {
    const result = await xrpcSafe(this.baseUrl, lexicon.app.bsky.feed.getPosts.main, {
      params: { uris: [uri] },
      signal: AbortSignal.timeout(1000),
    })

    if (!result.success) {
      logger.error(result, 'Invalid response from Bluesky App')
      Monocle.captureException(result, {
        extra: { uri },
        tags: { component: 'bsky_app_service' },
      })
      return
    }

    const post = result.body.posts[0]
    // The liked post could be removed, its author deactivated/suspended, etc.
    if (!post) return

    const {
      author: { avatar, displayName, handle },
      record: { text },
    } = post
    return {
      author: { avatar, displayName, handle },
      text: typeof text === 'string' ? text : undefined,
    }
  }
}
