import { BaseTransformer } from '@adonisjs/core/transformers'
import type * as lexicon from '#lexicons'
import type { Activity } from '#utils/activity'
import { annotate } from '#utils/richtext'

export type ActivityDetail = ReturnType<ActivityTransformer['toObject']>
export type AppBskyFeedLikeDetail = ReturnType<AppBskyFeedLike['toObject']>
export type AppBskyFeedPostDetail = ReturnType<AppBskyFeedPost['toObject']>
export type AppBskyGraphFollowDetail = ReturnType<AppBskyGraphFollow['toObject']>
export type IdSifaProfileLanguageDetail = ReturnType<IdSifaProfileLanguage['toObject']>
export type SiteStandardDocumentDetail = ReturnType<SiteStandardDocument['toObject']>

export default class ActivityTransformer extends BaseTransformer<Activity> {
  toObject() {
    const { resource } = this
    const { $type } = resource

    switch ($type) {
      case 'app.bsky.feed.like':
        return new AppBskyFeedLike(resource).toObject()
      case 'app.bsky.feed.post':
        return new AppBskyFeedPost(resource).toObject()
      case 'app.bsky.graph.follow':
        return new AppBskyGraphFollow(resource).toObject()
      case 'id.sifa.profile.language':
        return new IdSifaProfileLanguage(resource).toObject()
      case 'site.standard.document':
        return new SiteStandardDocument(resource).toObject()
      default:
        throw new Error(`Unsupported activity type: ${$type}`)
    }
  }
}

class AppBskyFeedLike extends BaseTransformer<lexicon.app.bsky.feed.like.Main> {
  toObject() {
    const subject = this.pick(this.resource.subject, ['$type', 'uri'])
    return { ...this.pick(this.resource, ['$type']), subject }
  }
}

class AppBskyFeedPost extends BaseTransformer<lexicon.app.bsky.feed.post.Main> {
  toObject() {
    const text = annotate(this.resource.text, this.resource.facets)
    return { ...this.pick(this.resource, ['$type']), text }
  }
}

class AppBskyGraphFollow extends BaseTransformer<lexicon.app.bsky.graph.follow.Main> {
  toObject() {
    return this.pick(this.resource, ['$type', 'subject'])
  }
}

class IdSifaProfileLanguage extends BaseTransformer<lexicon.id.sifa.profile.language.Main> {
  toObject() {
    return this.pick(this.resource, ['$type', 'name'])
  }
}

class SiteStandardDocument extends BaseTransformer<lexicon.site.standard.document.Main> {
  toObject() {
    return this.pick(this.resource, ['$type', 'description', 'site', 'tags', 'title'])
  }
}
