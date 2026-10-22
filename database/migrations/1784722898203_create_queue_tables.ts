import { BaseSchema } from '@adonisjs/lucid/schema'
import { KnexQueueSchemaService } from '@adonisjs/queue/drivers/knex_adapter'

export default class extends BaseSchema {
  override async up() {
    const schemaService = new KnexQueueSchemaService(this.db.getWriteClient())
    await schemaService.createJobsTable()
    await schemaService.createSchedulesTable()
  }

  override async down() {
    const schemaService = new KnexQueueSchemaService(this.db.getWriteClient())
    await schemaService.dropSchedulesTable()
    await schemaService.dropJobsTable()
  }
}
