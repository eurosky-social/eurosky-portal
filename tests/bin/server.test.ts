import assert from 'node:assert/strict'
import { type ChildProcessByStdio, spawn } from 'node:child_process'
import { once } from 'node:events'
import net from 'node:net'
import { createInterface } from 'node:readline'
import type { Readable } from 'node:stream'
import { text } from 'node:stream/consumers'
import test from 'node:test'
import { testEnv } from '../env.ts'

/**
 * What a server did.
 */
interface Result {
  /**
   * Exit code.
   */
  code: number | null

  /**
   * Log records.
   */
  logs: Array<unknown>

  /**
   * Other output, such as errors.
   */
  stderr: string
}

/**
 * Running server.
 */
interface Server {
  /**
   * Port.
   */
  port: number

  /**
   * Stop the server.
   *
   * @returns
   *   Promise that resolves to what it did.
   */
  stop(): Promise<Result>
}

const hostname = '127.0.0.1'

// Tests run at the same time, so this is about the slowest test.
test('server', { concurrency: true, timeout: 15_000 }, function () {
  test('should start', async function (t) {
    const server = await start(t.signal)
    const response = await fetch(`http://${hostname}:${server.port}/_health`)
    const body = await response.text()
    await server.stop()

    assert.equal(response.status, 200)
    assert.match(body, /ok/i)
  })

  test('should exit on `SIGTERM`', async function (t) {
    const server = await start(t.signal)
    const { code, stderr } = await server.stop()

    assert.equal(code, 0)
    assert.equal(stderr, '')
  })

  test('should exit 8 seconds after `SIGTERM` when busy', async function (t) {
    const server = await start(t.signal, ['./tests/busy.ts'])
    const { code, stderr } = await server.stop()

    assert.equal(code, 1)
    assert.match(stderr, /^Exiting while busy: .*Timeout/)
  })

  test('should exit when it cannot listen', async function (t) {
    const other = net.createServer().listen(0, hostname)
    await once(other, 'listening')
    const address = other.address()
    assert.ok(address && typeof address === 'object')
    const otherPort = address.port
    const child = serve(t.signal, otherPort)
    const stderr = text(child.stderr)
    await once(child, 'exit')
    other.close()

    assert.equal(child.exitCode, 1)
    assert.match(await stderr, /EADDRINUSE/)
  })

  test('should add request IDs to logs outside `ctx.logger`', async function (t) {
    const server = await start(t.signal)
    await fetch(`http://${hostname}:${server.port}/`)
    const { logs } = await server.stop()
    const request = logs.find((log) => field(log, 'msg')?.startsWith('request GET / '))
    // From a service, as the server is offline.
    const service = logs.find((log) => field(log, 'msg')?.startsWith('Failed to fetch listing'))
    const id = field(request, 'request_id')

    assert.ok(id)
    assert.equal(field(service, 'request_id'), id)
  })
})

/**
 * Start the server, offline.
 *
 * @param signal
 *   Signal to kill the server.
 * @param preloads
 *   Extra modules to load first.
 * @returns
 *   Promise that resolves to the server once it listens.
 */
async function start(signal: AbortSignal, preloads: Array<string> = []): Promise<Server> {
  const other = net.createServer().listen(0, hostname)
  await once(other, 'listening')
  const address = other.address()
  assert.ok(address && typeof address === 'object')
  const port = address.port
  other.close()
  await once(other, 'close')

  const child = serve(signal, port, preloads)
  const stderr = text(child.stderr)
  const logs: Array<unknown> = []

  await new Promise<undefined>(function (resolve, reject) {
    child.once('exit', function (): undefined {
      reject(new Error('Server exited before listening'))
    })
    createInterface({ input: child.stdout }).on('line', function (line): undefined {
      const log: unknown = JSON.parse(line)
      logs.push(log)
      if (field(log, 'msg')?.startsWith('started HTTP server')) resolve(undefined)
    })
  })

  return {
    port,
    async stop() {
      child.kill('SIGTERM')
      await once(child, 'exit')
      return { code: child.exitCode, logs, stderr: await stderr }
    },
  }
}

/**
 * Run the server, offline.
 *
 * @param signal
 *   Signal to kill the server.
 * @param port
 *   Port.
 * @param preloads
 *   Extra modules to load first.
 * @returns
 *   Process.
 */
function serve(
  signal: AbortSignal,
  port: number,
  preloads: Array<string> = []
): ChildProcessByStdio<null, Readable, Readable> {
  const imports = ['./tests/offline.ts', ...preloads].flatMap((path) => ['--import', path])

  return spawn(process.execPath, [...imports, 'bin/server.ts'], {
    env: {
      ...process.env,
      ...testEnv,
      DATABASE_AUTOMIGRATE: 'true',
      DATABASE_PATH: ':memory:',
      LOG_LEVEL: 'info',
      NODE_ENV: 'production',
      PORT: String(port),
    },
    killSignal: 'SIGKILL',
    signal,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

/**
 * Get a string field of a log record.
 *
 * @param log
 *   Log record.
 * @param name
 *   Field name.
 * @returns
 *   Value, if a string.
 */
function field(log: unknown, name: string): string | undefined {
  if (typeof log !== 'object' || log === null) return
  const value: unknown = Reflect.get(log, name)
  return typeof value === 'string' ? value : undefined
}
