import type { ApplicationService } from '@adonisjs/core/types'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { MigrationRunner } from '@adonisjs/lucid/migration'
import env from '#start/env'

/**
 * Runs migrations in `start`, which runs before preloads and before the
 * `start` of the providers that come after this one (such as the Jetstream
 * and queue worker providers, which need migrated tables).
 */
export default class AutomigrateProvider {
  constructor(protected app: ApplicationService) {}

  async start(): Promise<undefined> {
    if (this.app.getEnvironment() !== 'web') return

    logger.info(
      { shouldAutoMigrate: env.get('DATABASE_AUTOMIGRATE', false) },
      'Checking for auto-migration'
    )

    if (env.get('DATABASE_AUTOMIGRATE', false) !== true) return

    const migrator = new MigrationRunner(db, this.app, {
      direction: 'up',
      dryRun: false,
    })

    migrator.on('start', () => {
      logger.info('Running database migrations')
    })

    migrator.on('migration:completed', (migration) => {
      logger.info(`Migration ${migration.status}: ${migration.file.name}`)
    })

    migrator.on('migration:error', (migration) => {
      logger.error(`Migration ${migration.status}: ${migration.file.name}`)
    })

    migrator.on('end', () => {
      logger.info('Migrations finished')
    })

    await migrator.run()
  }
}
