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
  #app: ApplicationService

  constructor(app: ApplicationService) {
    this.#app = app
  }

  async start(): Promise<undefined> {
    // Not in `node ace codegen` and such, which boot the app as `web` too.
    if (this.#app.getEnvironment() !== 'web' || this.#app.getMode() !== 'run') return

    logger.info(
      { shouldAutoMigrate: env.get('DATABASE_AUTOMIGRATE', false) },
      'Checking for auto-migration'
    )

    if (env.get('DATABASE_AUTOMIGRATE', false) !== true) return

    const migrator = new MigrationRunner(db, this.#app, {
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

    await renameMovedMigrations()
    await migrator.run()
  }
}

/**
 * Rename migrations that ran when they were in `database/migrations/`, before
 * they moved to `app/database/migrations/`;
 * Lucid tracks migrations by path, so it would otherwise run them again.
 *
 * @returns
 *   Nothing.
 */
export async function renameMovedMigrations(): Promise<undefined> {
  if (!(await db.connection().schema.hasTable('adonis_schema'))) return

  const moved = await db
    .from('adonis_schema')
    .whereLike('name', 'database/migrations/%')
    .select('id')

  if (moved.length === 0) return

  await db
    .from('adonis_schema')
    .whereLike('name', 'database/migrations/%')
    .update({ name: db.raw(`'app/' || name`) })

  logger.info({ count: moved.length }, 'Renamed migrations moved to `app/database/migrations/`')
}
