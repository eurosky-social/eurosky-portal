import type { Profile } from '#extensions/atprotouser'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ProfileTransformer extends BaseTransformer<Profile> {
  toObject() {
    return {
      avatar: this.resource.avatar,
      displayName: this.resource.displayName,
      stats: {
        posts: this.resource.postsCount,
        follows: this.resource.followsCount,
        followers: this.resource.followersCount,
      },
    }
  }
}
