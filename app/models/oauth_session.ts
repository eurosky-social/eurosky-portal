import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export default class OauthSession extends BaseModel {
  declare sub: string
  declare updatedAt: DateTime
  declare value: string

  static {
    column({ isPrimary: true })(this.prototype, 'sub')
    column.dateTime({ autoCreate: true, autoUpdate: true })(this.prototype, 'updatedAt')
    column()(this.prototype, 'value')
  }
}
