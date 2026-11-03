import assert from 'node:assert/strict'
import test from 'node:test'
import { HealthChecks } from '@adonisjs/core/health'
import HealthTransformer from '#transformers/health_transformer'

test('HealthTransformer', function () {
  test('should pick `finishedAt`, `isHealthy`, and `status`', async function () {
    const report = await new HealthChecks().run()
    const result = new HealthTransformer(report).toObject()

    assert.deepEqual(result, { finishedAt: report.finishedAt, isHealthy: true, status: 'ok' })
  })
})
