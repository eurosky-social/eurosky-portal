import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth2_grants'

  override async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.text('access_token_hash').nullable().unique()
      table.timestamp('access_token_expires_at').nullable()
      table.text('client_id').notNullable()
      table.text('code_hash').nullable().unique()
      table.timestamp('code_expires_at').nullable()
      table.timestamp('created_at').notNullable()
      table.text('did').notNullable().references('did').inTable('accounts').onDelete('CASCADE')
      table.text('redirect_uri').notNullable()
      table.text('refresh_token_hash').nullable().unique()
      table.timestamp('revoked_at').nullable()
      table.text('scope').notNullable()
      table.timestamp('updated_at').notNullable()
      table.index(['did', 'client_id'])
    })
  }

  override async down() {
    this.schema.dropTable(this.tableName)
  }
}
