import { readFile, writeFile } from 'node:fs/promises'
import { indexPages } from '@adonisjs/inertia'
import { indexEntities } from '@adonisjs/core'
import { defineConfig } from '@adonisjs/core/app'
import { generateRegistry } from '@tuyau/core/hooks'

export default defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Experimental flags
  |--------------------------------------------------------------------------
  |
  | The following features will be enabled by default in the next major release
  | of AdonisJS. You can opt into them today to avoid any breaking changes
  | during upgrade.
  |
  */
  experimental: {},

  /*
  |--------------------------------------------------------------------------
  | Directories
  |--------------------------------------------------------------------------
  |
  | Everything imported through `#*` (`package.json`) lives in `app/`;
  | `config/` stays, as Adonis expects it there (`indexEntities`).
  |
  */
  directories: {
    factories: 'app/database/factories',
    migrations: 'app/database/migrations',
    providers: 'app/providers',
    seeders: 'app/database/seeders',
    start: 'app/start',
  },

  /*
  |--------------------------------------------------------------------------
  | Commands
  |--------------------------------------------------------------------------
  |
  | List of ace commands to register from packages and this app
  | (`app/commands/main.ts`).
  |
  */
  commands: [
    () => import('#commands/main'),
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands'),
    () => import('@adonisjs/session/commands'),
    () => import('@adonisjs/inertia/commands'),
    () => import('@adonisjs/cache/commands'),
    () => import('@adonisjs/queue/commands'),
  ],

  /*
  |--------------------------------------------------------------------------
  | Service providers
  |--------------------------------------------------------------------------
  |
  | List of service providers to import and register when booting the
  | application
  |
  */
  providers: [
    () => import('@adonisjs/otel/otel_provider'),
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    {
      file: () => import('@adonisjs/core/providers/repl_provider'),
      environment: ['repl', 'test'],
    },
    () => import('@adonisjs/core/providers/vinejs_provider'),
    () => import('@adonisjs/core/providers/edge_provider'),
    () => import('@adonisjs/session/session_provider'),
    () => import('@adonisjs/vite/vite_provider'),
    () => import('@adonisjs/shield/shield_provider'),
    () => import('@adonisjs/static/static_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('#providers/automigrate_provider'),
    () => import('@adonisjs/queue/queue_provider'),
    () => import('@adonisjs/cors/cors_provider'),
    () => import('@adonisjs/inertia/inertia_provider'),
    () => import('@adonisjs/auth/auth_provider'),
    () => import('#providers/api_provider'),
    () => import('#providers/jetstream_provider'),
    () => import('#providers/queue_worker_provider'),
    () => import('@thisismissem/adonisjs-atproto-oauth/provider'),
    () => import('#extensions/atprotouser'),
    () => import('@adonisjs/content/content_provider'),
    () => import('@adonisjs/cache/cache_provider'),
    () => import('@adonisjs/i18n/i18n_provider'),
  ],

  /*
  |--------------------------------------------------------------------------
  | Preloads
  |--------------------------------------------------------------------------
  |
  | List of modules to import before starting the application.
  |
  */
  preloads: [
    () => import('#start/dates'),
    () => import('#start/events'),
    () => import('#start/routes'),
    () => import('#start/kernel'),
    () => import('#start/validator'),
    () => import('#start/logging'),
    () => import('#start/view'),
  ],

  /*
  |--------------------------------------------------------------------------
  | Tests
  |--------------------------------------------------------------------------
  |
  | List of test suites to organize tests by their type. Feel free to remove
  | and add additional suites.
  | There are also tests using `node:test`, which are not included here.
  |
  */
  tests: {
    suites: [
      {
        files: ['tests/adonis/**/*.spec.{js,ts}'],
        name: 'adonis',
        timeout: 30000,
      },
      {
        files: ['tests/browser/**/*.spec.{js,ts}'],
        name: 'browser',
        timeout: 300000,
      },
    ],
    forceExit: false,
  },

  /*
  |--------------------------------------------------------------------------
  | Metafiles
  |--------------------------------------------------------------------------
  |
  | A collection of files you want to copy to the build folder when creating
  | the production build.
  |
  */
  metaFiles: [
    {
      pattern: 'resources/views/**/*.edge',
      reloadServer: false,
    },
    {
      pattern: 'data/**',
      reloadServer: false,
    },
    {
      pattern: 'public/**',
      reloadServer: false,
    },
  ],

  hooks: {
    init: [
      indexEntities({
        transformers: { enabled: true, withSharedProps: true },
      }),
      indexPages({ framework: 'react' }),
      generateRegistry(),
    ],
    buildStarting: [() => import('@adonisjs/vite/build_hook')],
    buildFinished: [
      {
        /**
         * Node runs the `.ts` files in development.
         * Replace the `.ts` extensions with `.js` in the built `package.json` imports.
         */
        async run(bundler) {
          const file = new URL('build/package.json', bundler.cwd)
          const packageJson = JSON.parse(await readFile(file, 'utf8'))
          for (const [key, value] of Object.entries(packageJson.imports)) {
            packageJson.imports[key] = String(value).replace(/\.ts$/, '.js')
          }
          await writeFile(file, JSON.stringify(packageJson, undefined, 2) + '\n')
        },
      },
    ],
  },
})
