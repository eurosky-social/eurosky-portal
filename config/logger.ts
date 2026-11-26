import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { HttpContext } from '@adonisjs/core/http'
import { defineConfig, syncDestination, targets } from '@adonisjs/core/logger'

interface MixinResult {
  request_id?: string
}

const loggerConfig = defineConfig({
  /**
   * Default logger name used by ctx.logger and app logger calls.
   */
  default: 'app',

  loggers: {
    app: {
      /**
       * Use sync destination in non-production for immediate flush.
       */
      destination: !app.inProduction ? await syncDestination() : undefined,

      /**
       * Toggle this logger on/off.
       */
      enabled: true,

      /**
       * Minimum level to output (trace, debug, info, warn, error, fatal).
       */
      level: env.get('LOG_LEVEL'),

      /**
       * Pino mixing to get the request ID.
       *
       * @param _mergeObject
       *   Fields passed when logging.
       * @param _level
       *   Level.
       * @param logger
       *   Logger.
       * @returns
       *   Fields to add.
       */

      mixin(_mergeObject, _level, logger): MixinResult {
        const bindings = logger.bindings()
        const id = HttpContext.get()?.request.id()
        return 'request_id' in bindings || !id ? {} : { request_id: id }
      },

      /**
       * Logger name shown in log records.
       */
      name: env.get('APP_NAME'),

      /**
       * Redact for privacy, security.
       */
      redact: ['query.code', 'query.state'],

      /**
       * Configure where logs are written.
       */
      transport: {
        targets: targets()
          .pushIf(!app.inProduction, targets.pretty())
          .pushIf(app.inProduction, targets.file({ destination: 1 }))
          .toArray(),
      },
    },
  },
})

export default loggerConfig

/**
 * Inferring types for the list of loggers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
