import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'accounts'

  override async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('handle').nullable()
    })
  }

  override async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('handle')
    })
  }
}
