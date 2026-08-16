import type { ApplicationService } from '@adonisjs/core/types'
import PluginRegistry from '#services/plugin_registry'

export default class PluginRegistryProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(PluginRegistry, () => new PluginRegistry())
  }
}
