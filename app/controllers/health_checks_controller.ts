import { healthChecks } from '#start/health'
import HealthTransformer from '#transformers/health_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class HealthChecksController {
  async live({ response }: HttpContext) {
    return response.ok('ok')
  }

  async ready({ response, serialize }: HttpContext) {
    const report = await healthChecks.run()
    const serializedReport = await serialize(HealthTransformer.transform(report))

    if (report.isHealthy) {
      return response.ok(serializedReport)
    }

    return response.serviceUnavailable(serializedReport)
  }
}
