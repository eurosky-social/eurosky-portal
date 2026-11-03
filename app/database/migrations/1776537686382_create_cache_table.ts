import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cache'

  override async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('key', 255).notNullable().primary()
      table.text('value', 'longtext')
      table.timestamp('expires_at').nullable()
    })
  }

  override async down() {
    this.schema.dropTable(this.tableName)
  }
}
