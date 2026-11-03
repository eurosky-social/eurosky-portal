/*
|--------------------------------------------------------------------------
| Development server
|--------------------------------------------------------------------------
|
| Because `ace serve` always adds `@poppinss/ts-exec`, this does what
| `node ace serve --hmr` would do but with Node running the TypeScript
| itself.
|
| * generate `.adonisjs/` with `node ace codegen`
| * run `bin/server.ts` with `hot-hook`, which hot reloads boundaries
|   (`hotHook` in `package.json`) and asks for a full reload otherwise
| * restart on full reloads, generating `.adonisjs/` again first
| * generate `.adonisjs/` again when files are added or removed
| * start again on the next change after the server crashed
|
*/

import { type ChildProcess, fork, spawnSync } from 'node:child_process'
import { rmSync, watch } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))

/**
 * Folders with files that `.adonisjs/` lists.
 */
const generatedFrom = ['app', 'inertia/pages']

let server: ChildProcess | undefined
let timeout: NodeJS.Timeout | undefined

codegen()
start()

for (const folder of generatedFrom) {
  watch(new URL(`../${folder}/`, import.meta.url), { recursive: true }, function (event) {
    clearTimeout(timeout)

    // Crashed, so `hot-hook` is not running.
    if (server?.exitCode !== null) {
      timeout = setTimeout(restart, 100)
    }
    // `rename` is how `fs.watch` reports files that are added or removed.
    else if (event === 'rename') {
      timeout = setTimeout(codegen, 100)
    }
  })
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)

/**
 * Generate `.adonisjs/`.
 */
function codegen(): undefined {
  spawnSync(process.execPath, ['ace.js', 'codegen'], { cwd: root, stdio: 'inherit' })
}

/**
 * Start the server.
 */
function start(): undefined {
  const child = fork(new URL('server.ts', import.meta.url), process.argv.slice(2), {
    // Like `ace serve`: `DEV_MODE` makes `@adonisjs/vite` run Vite.
    env: { ...process.env, DEV_MODE: 'true' },
    execArgv: ['--import=hot-hook/register'],
  })

  child.on('message', function (message) {
    if (isFullReload(message) && child === server) restart()
    // Like `ace serve`, which reads it for `routesScanned` hooks; `codegen`
    // already does that.
    const routes = routesFileLocation(message)
    if (routes) rmSync(routes, { force: true })
  })

  server = child
}

/**
 * Restart the server.
 */
function restart(): undefined {
  const child = server

  if (!child || child.exitCode !== null) {
    codegen()
    start()
    return
  }

  child.once('exit', function () {
    codegen()
    start()
  })
  child.kill('SIGTERM')
}

/**
 * Stop.
 */
function stop(): undefined {
  const child = server

  if (!child || child.exitCode !== null) {
    process.exit()
  }

  child.once('exit', function () {
    process.exit()
  })
  child.kill('SIGTERM')
}

/**
 * Check whether a message from `hot-hook` asks for a full reload.
 */
function isFullReload(message: unknown): boolean {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === 'hot-hook:full-reload'
  )
}

/**
 * Get the file that Adonis writes routes to, from its message.
 */
function routesFileLocation(message: unknown): string | undefined {
  if (
    typeof message === 'object' &&
    message !== null &&
    'routesFileLocation' in message &&
    typeof message.routesFileLocation === 'string'
  ) {
    return message.routesFileLocation
  }
}
