import { BaseSchema } from '@adonisjs/lucid/schema'
import { KnexQueueSchemaService } from '@adonisjs/queue/drivers/knex_adapter'

/**
 * Upgrade tables created by `@adonisjs/queue` 0.6 to the format of 0.7,
 * like `node ace queue:migrate` does for SQLite.
 * Both steps do nothing on tables that are already up to date.
 */
export default class extends BaseSchema {
  override async up() {
    const schemaService = new KnexQueueSchemaService(this.db.getWriteClient())
    await schemaService.addDedupColumns()
    await schemaService.migrateScheduleDates()
  }

  override async down() {}
}
