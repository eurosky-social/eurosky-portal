import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'accounts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('last_storage_sync_at').nullable()
      // Track last revision of a user’s repo, for incremental syncs.
      table.text('last_storage_sync_rev').nullable()
      // Track last full sync, needed to pick up on deletions.
      table.timestamp('last_storage_full_sync_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('last_storage_sync_at')
      table.dropColumn('last_storage_sync_rev')
      table.dropColumn('last_storage_full_sync_at')
    })
  }
}
