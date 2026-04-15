import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'blob'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.text('cid').notNullable()
      table.text('createdAt').notNullable()
      table.text('creator').notNullable()
      table.text('mimeType').nullable()
      table.integer('size').notNullable().defaultTo(0)
      table.primary(['cid', 'creator'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
