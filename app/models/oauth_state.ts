import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export default class OauthState extends BaseModel {
  declare key: string
  declare updatedAt: DateTime
  declare value: string

  static {
    column({ isPrimary: true })(this.prototype, 'key')
    column.dateTime({ autoCreate: true, autoUpdate: true })(this.prototype, 'updatedAt')
    column()(this.prototype, 'value')
  }
}
