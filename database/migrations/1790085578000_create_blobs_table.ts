import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'blobs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.text('category').notNullable()
      table.text('cid').notNullable()
      table.text('created_at').notNullable()
      table.text('creator').notNullable()
      table.text('mime_type').nullable()
      table.integer('size').notNullable().defaultTo(0)
      table.unique(['cid', 'creator'])
      table.index(['creator', 'category', 'size', 'cid'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
