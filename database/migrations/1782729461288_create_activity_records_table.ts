import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('activity_records', (table) => {
      table.text('uri').notNullable().primary()
      table.text('did').notNullable().references('did').inTable('accounts').onDelete('CASCADE')
      table.text('collection').notNullable()
      table.text('rkey').notNullable()
      table.text('cid').notNullable()
      table.text('text').nullable()
      table.timestamp('created_at').nullable()
      table.timestamp('indexed_at').notNullable()

      table.index(['did', 'created_at'])
    })

    this.schema.alterTable('accounts', (table) => {
      table.timestamp('last_activity_sync_at').nullable()
      table.timestamp('last_login_at').nullable()
      table.index(['last_login_at'])
    })

    // Give existing accounts something.
    this.defer(async (db) => {
      await db.rawQuery(
        `update accounts set last_login_at = updated_at where last_login_at is null`
      )
    })
  }

  async down() {
    this.schema.dropTable('activity_records')
    this.schema.alterTable('accounts', (table) => {
      table.dropColumn('last_activity_sync_at')
      table.dropColumn('last_login_at')
    })
  }
}
