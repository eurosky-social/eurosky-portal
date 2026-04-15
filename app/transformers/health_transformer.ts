import { BaseTransformer } from '@adonisjs/core/transformers'
import type { HealthCheckReport } from '@adonisjs/core/types/health'

export default class HealthTransformer extends BaseTransformer<HealthCheckReport> {
  toObject() {
    return this.pick(this.resource, ['status', 'isHealthy', 'finishedAt'])
  }
}
