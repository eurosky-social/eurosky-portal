import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { l } from '@atproto/lex'
import type { DateTime } from 'luxon'

/**
 * Access a person gave a client of our OAuth 2.0 server (see
 * `Oauth2Service`);
 * one per authorization: a code at first, then tokens.
 */
export default class Oauth2Grant extends BaseModel {
  static override table = 'oauth2_grants'

  declare accessTokenExpiresAt: DateTime | null
  declare accessTokenHash: string | null
  declare clientId: string
  declare codeExpiresAt: DateTime | null
  declare codeHash: string | null
  declare createdAt: DateTime<true>
  declare did: l.DidString
  declare id: number
  declare redirectUri: string
  declare refreshTokenHash: string | null
  declare revokedAt: DateTime | null
  declare scope: string
  declare updatedAt: DateTime

  static {
    column.dateTime()(this.prototype, 'accessTokenExpiresAt')
    column()(this.prototype, 'accessTokenHash')
    column()(this.prototype, 'clientId')
    column.dateTime()(this.prototype, 'codeExpiresAt')
    column()(this.prototype, 'codeHash')
    column.dateTime({ autoCreate: true })(this.prototype, 'createdAt')
    column()(this.prototype, 'did')
    column({ isPrimary: true })(this.prototype, 'id')
    column()(this.prototype, 'redirectUri')
    column()(this.prototype, 'refreshTokenHash')
    column.dateTime()(this.prototype, 'revokedAt')
    column()(this.prototype, 'scope')
    column.dateTime({ autoCreate: true, autoUpdate: true })(this.prototype, 'updatedAt')
  }
}
