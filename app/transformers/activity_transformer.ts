import { BaseTransformer } from '@adonisjs/core/transformers'
import type { JSONDataTypes } from '@adonisjs/core/types/transformers'
import type { AtUriString } from '@atproto/lex'
import { truncate } from 'hast-util-truncate'
import * as lexicon from '#lexicons'
import type { Activity } from '#utils/activity'
import { type Context, toBlobLocator } from '#utils/blob'
import { toEmbed } from '#utils/embed'
import { toHast as bskyRichtextToHast } from '#utils/bsky_richtext'
import { toHast as leafletToHast } from '#utils/leaflet'

export type ActivityDetail = ReturnType<ActivityTransformer['toObject']>
export type AppBskyFeedLikeDetail = ReturnType<AppBskyFeedLike['toObject']>
export type AppBskyFeedPostDetail = ReturnType<AppBskyFeedPost['toObject']>
export type AppBskyGraphFollowDetail = ReturnType<AppBskyGraphFollow['toObject']>
export type SiteStandardDocumentDetail = ReturnType<SiteStandardDocument['toObject']>

export interface RecordContext extends Context {
  /**
   * `at://` URI of the record itself.
   */
  uri: AtUriString
}

export default class ActivityTransformer extends BaseTransformer<Activity> {
  #context: RecordContext

  constructor(resource: Activity, context: RecordContext) {
    super(resource)
    this.#context = context
  }

  toObject() {
    const { resource } = this
    const { $type } = resource

    switch ($type) {
      case 'app.bsky.feed.like':
        return new AppBskyFeedLike(resource).toObject()
      case 'app.bsky.feed.post':
        return new AppBskyFeedPost(resource, this.#context).toObject()
      case 'app.bsky.graph.follow':
        return new AppBskyGraphFollow(resource).toObject()
      case 'site.standard.document':
        return new SiteStandardDocument(resource, this.#context).toObject()
      default:
        throw new Error(`Unsupported activity type: ${$type}`)
    }
  }
}

class AppBskyFeedLike extends BaseTransformer<lexicon.app.bsky.feed.like.Main> {
  toObject() {
    return { ...this.pick(this.resource, ['$type']), openUri: this.resource.subject.uri }
  }
}

class AppBskyFeedPost extends BaseTransformer<lexicon.app.bsky.feed.post.Main> {
  #context: RecordContext

  constructor(resource: lexicon.app.bsky.feed.post.Main, context: RecordContext) {
    super(resource)
    this.#context = context
  }

  toObject() {
    const embed = this.resource.embed ? toEmbed(this.resource.embed, this.#context) : undefined
    const openUri = this.#context.uri
    const replyUri = this.resource.reply ? this.resource.reply.parent.uri : undefined
    // Cast because Inertia fails on hast TS interfaces.
    const text = bskyRichtextToHast(
      this.resource.text,
      this.resource.facets
    ) as unknown as JSONDataTypes
    return { ...this.pick(this.resource, ['$type']), embed, openUri, replyUri, text }
  }
}

class AppBskyGraphFollow extends BaseTransformer<lexicon.app.bsky.graph.follow.Main> {
  toObject() {
    const { subject } = this.resource
    const openUri: AtUriString = `at://${subject}`
    return { ...this.pick(this.resource, ['$type']), openUri, subject }
  }
}

class SiteStandardDocument extends BaseTransformer<lexicon.site.standard.document.Main> {
  #context: RecordContext

  constructor(resource: lexicon.site.standard.document.Main, context: RecordContext) {
    super(resource)
    this.#context = context
  }

  toObject() {
    const { content: rawContent } = this.resource
    // Only leaflet supported for now.
    let root =
      rawContent && lexicon.pub.leaflet.content.main.isTypeOf(rawContent)
        ? leafletToHast(rawContent, this.#context)
        : undefined
    // Don’t accidentally send giant trees.
    if (root) root = truncate(root, { ellipsis: '…', size: 4096 })

    const content = root as unknown as JSONDataTypes | undefined
    const coverImage = this.resource.coverImage
      ? toBlobLocator(this.resource.coverImage, this.#context)
      : undefined

    return {
      ...this.pick(this.resource, [
        '$type',
        'contributors',
        'description',
        'publishedAt',
        'tags',
        'textContent',
        'title',
        'updatedAt',
      ]),
      content,
      coverImage,
      openUri: this.#context.uri,
    }
  }
}
