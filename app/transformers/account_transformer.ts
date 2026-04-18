import type Account from '#models/account'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ProfileTransformer extends BaseTransformer<Account> {
  toObject() {
    return this.pick(this.resource, ['did', 'handle'])
  }
}
