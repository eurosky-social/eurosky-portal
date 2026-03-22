import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class OauthState extends BaseModel {
  @column({ isPrimary: true })
  declare key: string

  @column()
  declare value: string

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
