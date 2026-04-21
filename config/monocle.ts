import { defineConfig } from '@monocle.sh/adonisjs-agent'
import pkg from '../package.json' with { type: 'json' }
import env from '#start/env'

export default defineConfig({
  apiKey: env.get('MONOCLE_API_KEY'),

  dev: env.get('NODE_ENV', 'development') === 'development',

  serviceName: pkg.name,
  serviceVersion: pkg.version,
  environment: env.get('APP_ENV'),

  http: {
    sanitizeUrls: {
      enabled: true,
      queryParams: ['code', 'state', 'iss'],
    },
  },

  instrumentations: {
    '@opentelemetry/instrumentation-http': {
      // Add URLs to ignore (merged with defaults by default)
      ignoredUrls: [
        '/_health',
        '/_readiness',
        '/assets/*',
        '/static/*',
        '/icons/*',
        '/favicon.ico',
      ],

      // Set to false to replace default ignored URLs instead of merging
      mergeIgnoredUrls: true,

      // Ignore static files like css, js, images (default: true)
      ignoreStaticFiles: true,
    },
  },
})
