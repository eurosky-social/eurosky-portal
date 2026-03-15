import type { Profile } from '#extensions/atprotouser'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ProfileTransformer extends BaseTransformer<Profile> {
  toObject() {
    return this.pick(this.resource, [
      'avatar',
      'displayName',
      'handle',
      'postsCount',
      'followsCount',
      'followersCount',
    ])
  }
}
