import type { ApplicationService } from '@adonisjs/core/types'
import jetstreamService from '#services/jetstream_service'

export default class JetstreamProvider {
  #app: ApplicationService

  constructor(app: ApplicationService) {
    this.#app = app
  }

  async start() {
    if (this.#app.getEnvironment() !== 'web' || this.#app.getMode() !== 'run') return
    await jetstreamService.start()
  }

  async shutdown() {
    jetstreamService.stop()
  }
}
