import type { ApplicationService } from '@adonisjs/core/types'
import { configProvider } from '@adonisjs/core'
import type { AdapterFactory, Adapter, JobClass, QueueConfig } from '@adonisjs/queue/types'
import type { Worker } from '@adonisjs/queue'

/**
 * Runs the queue worker in the process as the app is deployed as a single container.
 */
export default class QueueWorkerProvider {
  #worker: Worker | undefined

  constructor(protected app: ApplicationService) {}

  async shutdown(): Promise<undefined> {
    await this.#worker?.stop()
  }

  async start(): Promise<undefined> {
    if (this.app.getEnvironment() !== 'web') return

    const { Worker: WorkerClass } = await import('@adonisjs/queue')
    const adapters: Record<string, AdapterFactory> = {}
    const config = this.app.config.get<QueueConfig>('queue')
    const logger = await this.app.container.make('logger')

    for (const [name, adapterConfig] of Object.entries(config.adapters)) {
      const resolved =
        typeof adapterConfig === 'function'
          ? adapterConfig
          : await configProvider.resolve<AdapterFactory | Adapter>(this.app, adapterConfig)
      if (!resolved) throw new Error(`Cannot resolve queue adapter \`${name}\``)
      adapters[name] = typeof resolved === 'function' ? resolved : () => resolved
    }

    this.#worker = new WorkerClass({
      ...config,
      adapters,
      jobFactory: (jobClass: JobClass) => this.app.container.make(jobClass),
      logger,
    })

    this.#worker.start(['default']).catch((err: unknown) => {
      logger.error({ err }, 'queue: worker crashed')
    })
  }
}
