import type { ApplicationService } from '@adonisjs/core/types'
import jetstreamService from '#services/jetstream_service'

export default class JetstreamProvider {
  constructor(protected app: ApplicationService) {}

  async start() {
    if (this.app.getEnvironment() !== 'web') return
    await jetstreamService.start()
  }

  async shutdown() {
    jetstreamService.stop()
  }
}
