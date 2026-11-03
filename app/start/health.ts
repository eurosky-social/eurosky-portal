import { HealthChecks, MemoryHeapCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([new MemoryHeapCheck()])
