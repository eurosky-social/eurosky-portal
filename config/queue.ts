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
     * Currently there is only the backfill job which fans out to 4 supported
     * collections, which each paginate by `100` (to get up to `1000` records
     * per collection).
     * So this number is relatively low because:
     *
     * * users are all on single PDS
     * * single SQLite writer lock
     *
     * Can be revisited if database is changed or if the worker moves to
     * another process.
     */
    concurrency: 20,

    /**
     * Backfills are network-bound and can run for a while.
     */
    stalledThreshold: '10m',
  },
})
