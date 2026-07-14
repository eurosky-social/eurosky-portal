import { BaseTransformer } from '@adonisjs/core/transformers'
import type { AtUriString } from '@atproto/lex'
import type * as lexicon from '#lexicons'
import type { Activity } from '#utils/activity'
import { type Context, toEmbed } from '#utils/embed'
import { annotate } from '#utils/richtext'

export type ActivityDetail = ReturnType<ActivityTransformer['toObject']>
export type AppBskyFeedLikeDetail = ReturnType<AppBskyFeedLike['toObject']>
export type AppBskyFeedPostDetail = ReturnType<AppBskyFeedPost['toObject']>
export type AppBskyGraphFollowDetail = ReturnType<AppBskyGraphFollow['toObject']>
export type IdSifaProfileLanguageDetail = ReturnType<IdSifaProfileLanguage['toObject']>
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
      case 'id.sifa.profile.language':
        return new IdSifaProfileLanguage(resource).toObject()
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
    const text = annotate(this.resource.text, this.resource.facets)
    return { ...this.pick(this.resource, ['$type']), embed, openUri, replyUri, text }
  }
}

class AppBskyGraphFollow extends BaseTransformer<lexicon.app.bsky.graph.follow.Main> {
  toObject() {
    const openUri: AtUriString = `at://${this.resource.subject}`
    return { ...this.pick(this.resource, ['$type']), openUri }
  }
}

class IdSifaProfileLanguage extends BaseTransformer<lexicon.id.sifa.profile.language.Main> {
  toObject() {
    return this.pick(this.resource, ['$type', 'name'])
  }
}

class SiteStandardDocument extends BaseTransformer<lexicon.site.standard.document.Main> {
  #context: RecordContext

  constructor(resource: lexicon.site.standard.document.Main, context: RecordContext) {
    super(resource)
    this.#context = context
  }

  toObject() {
    return {
      ...this.pick(this.resource, ['$type', 'description', 'site', 'tags', 'title']),
      openUri: this.#context.uri,
    }
  }
}
