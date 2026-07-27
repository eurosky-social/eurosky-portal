import { defineConfig, drivers } from '@adonisjs/queue'

export default defineConfig({
  adapters: { database: drivers.database({ connectionName: 'sqlite' }) },
  default: 'database',
  locations: ['./app/jobs/**/*.{js,ts}'],
  worker: {
    /**
     * Max jobs allowed at once; prevents problems on bursts at launch /
     * wild pathological cases.
     *
     * For now, there’s only the backfill job.
     * The current choice `200` is a plausible value to start with.
     * Should be revisited later.
     * At that point moving it to another process may be a good idea.
     */
    concurrency: 200,

    /**
     * Backfills are network-bound and can run for a while.
     */
    stalledThreshold: '10m',
  },
})
