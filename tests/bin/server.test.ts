import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import test from 'node:test'
import { testEnv } from '../env.ts'

test('server', function () {
  test('should exit on `SIGTERM`', async function () {
    const child = spawn(process.execPath, ['bin/server.ts'], {
      env: {
        ...process.env,
        ...testEnv,
        DATABASE_AUTOMIGRATE: 'true',
        DATABASE_PATH: ':memory:',
        LOG_LEVEL: 'info',
        NODE_ENV: 'production',
        PORT: '4077',
      },
      stdio: ['ignore', 'pipe', 'inherit'],
    })
    child.stdout.on('data', (data: Buffer): undefined => {
      if (String(data).includes('started HTTP server')) child.kill('SIGTERM')
    })
    const [code] = (await once(child, 'exit')) as [number | null]

    // Not `1`, from still being busy after 8 seconds.
    assert.equal(code, 0)
  })
})
