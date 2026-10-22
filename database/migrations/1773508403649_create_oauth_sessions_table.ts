import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'oauth_sessions'

  override async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.text('sub').primary()
      table.text('value').notNullable()

      table.timestamp('updated_at')
    })
  }

  override async down() {
    this.schema.dropTable(this.tableName)
  }
}
