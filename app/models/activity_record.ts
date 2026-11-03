import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { l } from '@atproto/lex'
import type { DateTime } from 'luxon'

export default class ActivityRecord extends BaseModel {
  declare cid: string
  declare collection: string
  declare createdAt: DateTime | null
  declare did: l.DidString
  declare indexedAt: DateTime
  declare rkey: string
  declare text: string | null
  declare uri: string

  static {
    column()(this.prototype, 'cid')
    column()(this.prototype, 'collection')
    column.dateTime()(this.prototype, 'createdAt')
    column()(this.prototype, 'did')
    column.dateTime()(this.prototype, 'indexedAt')
    column()(this.prototype, 'rkey')
    column()(this.prototype, 'text')
    column({ isPrimary: true })(this.prototype, 'uri')
  }
}
