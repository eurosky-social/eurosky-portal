import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { l } from '@atproto/lex'
import type { DateTime } from 'luxon'

export default class Account extends BaseModel {
  declare createdAt: DateTime | null
  declare did: l.DidString
  declare handle: l.HandleString | null
  declare lastActiveAt: DateTime | null
  declare lastActivitySyncAt: DateTime | null
  declare lastStorageFullSyncAt: DateTime | null
  declare lastStorageSyncAt: DateTime | null
  declare lastStorageSyncRev: string | null
  declare termsAcceptedAt: DateTime | null
  declare updatedAt: DateTime | null
  declare welcomeDismissed: boolean | null

  static {
    column.dateTime({ autoCreate: true })(this.prototype, 'createdAt')
    column({ isPrimary: true })(this.prototype, 'did')
    column()(this.prototype, 'handle')
    column.dateTime()(this.prototype, 'lastActiveAt')
    column.dateTime()(this.prototype, 'lastActivitySyncAt')
    column.dateTime()(this.prototype, 'lastStorageFullSyncAt')
    column.dateTime()(this.prototype, 'lastStorageSyncAt')
    column()(this.prototype, 'lastStorageSyncRev')
    column.dateTime()(this.prototype, 'termsAcceptedAt')
    column.dateTime({ autoCreate: true, autoUpdate: true })(this.prototype, 'updatedAt')
    column({
      consume(value) {
        return Boolean(value)
      },
    })(this.prototype, 'welcomeDismissed')
  }
}
