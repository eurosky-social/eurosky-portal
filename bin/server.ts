/**
 * OpenTelemetry initialization - MUST be the first import
 * @see https://opentelemetry.io/docs/languages/js/getting-started/nodejs/
 */
import '../otel.ts'

/*
|--------------------------------------------------------------------------
| HTTP server entrypoint
|--------------------------------------------------------------------------
|
| The "server.ts" file is the entrypoint for starting the AdonisJS HTTP
| server. Either you can run this file directly or use the "serve"
| command to run this file and monitor file changes
|
*/

await import('reflect-metadata')
const { Ignitor, prettyPrintError } = await import('@adonisjs/core')
const { default: rcFile } = await import('../adonisrc.ts')

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)

/**
 * The importer is used to import files in context of the
 * application.
 */
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.rcContents(rcFile)
    app.booting(async () => {
      await import('#start/env')
    })
    app.listen('SIGTERM', terminate)
    app.listenIf(app.managedByPm2, 'SIGINT', terminate)

    /**
     * Exit before Docker kills after 10 seconds, which can hang.
     *
     * @returns
     *   Nothing.
     */
    function terminate(): Promise<void> {
      setTimeout(() => {
        console.error('Exiting while busy: %s', process.getActiveResourcesInfo().join(', '))
        process.exit(1)
      }, 8000).unref()
      return app.terminate()
    }
  })
  .httpServer()
  .start()
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
