import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export default class Blob extends BaseModel {
  declare category: string
  declare cid: string
  declare createdAt: DateTime
  declare creator: string
  declare id: number
  declare mimeType: string | null
  declare size: number

  static {
    column()(this.prototype, 'category')
    column()(this.prototype, 'cid')
    column.dateTime({ autoCreate: true })(this.prototype, 'createdAt')
    column()(this.prototype, 'creator')
    column({ isPrimary: true })(this.prototype, 'id')
    column()(this.prototype, 'mimeType')
    column()(this.prototype, 'size')
  }
}
