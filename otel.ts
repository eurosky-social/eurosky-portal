/**
 * OpenTelemetry initialization file.
 *
 * IMPORTANT: This file must be imported FIRST in bin/server.ts
 * for auto-instrumentation to work correctly.
 */
import env from '#start/env'

if (env.get('OTEL_ENABLED', false)) {
  const { init } = await import('@adonisjs/otel/init')
  await init(import.meta.dirname)
}
