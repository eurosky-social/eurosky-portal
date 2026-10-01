import { defineConfig } from '@adonisjs/otel'
import packageJson from '../package.json' with { type: 'json' }
import env from '#start/env'
import { redactCallbackParams } from '#utils/oauth'

/**
 * Span attributes that contain the query string, across the old and stable
 * HTTP semantic conventions.
 */
const urlAttributes = new Set(['http.target', 'http.url', 'url.full', 'url.query'])

/**
 * OpenTelemetry.
 *
 * Telemetry is exported over OTLP to wherever the standard
 * `OTEL_EXPORTER_OTLP_*` environment variables point.
 *
 * @see https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/
 */
export default defineConfig({
  enabled: env.get('OTEL_ENABLED', false),
  environment: env.get('APP_ENV'),
  instrumentations: {
    '@opentelemetry/instrumentation-dns': { enabled: false },
    '@opentelemetry/instrumentation-http': {
      ignoreStaticFiles: true,
      ignoredUrls: [
        '/_health',
        '/_readiness',
        '/assets/*',
        '/static/*',
        '/icons/*',
        '/favicon.ico',
      ],
      mergeIgnoredUrls: true,
      requestHook(span): undefined {
        if (!('attributes' in span)) return
        const { attributes } = span
        if (typeof attributes !== 'object' || attributes === null) return

        for (const [key, value] of Object.entries(attributes)) {
          if (urlAttributes.has(key) && typeof value === 'string') {
            span.setAttribute(key, redactCallbackParams(value, key === 'url.query'))
          }
        }
      },
    },
  },
  serviceName: packageJson.name,
  serviceVersion: packageJson.version,
  /**
   * User is set in `silent_auth_middleware.ts` after auth is initialized.
   */
  userContext: false,
})
