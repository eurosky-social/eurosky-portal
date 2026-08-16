export interface BrandIdentity {
  name: string
  nameShort: string
  taglineLead: string
  helpUrl: string
  contactUrl: string
  feedbackUrl?: string
  homeDescriptor?: string
}

export interface PluginDefinition {
  id: string
  brand?: Partial<BrandIdentity>
}

export const defaultBrand: BrandIdentity = {
  name: 'Eurosky',
  nameShort: 'Eurosky',
  taglineLead: 'Your Portal to',
  helpUrl: 'https://eurosky.tech/help/',
  contactUrl: 'https://eurosky.tech/contact/',
  feedbackUrl: 'https://userinput.app/#/s/did:plc:ooensn4mr5mhznzypvxelfa3/3mr5gmbhteg2p',
  homeDescriptor: 'European',
}

export default class PluginRegistry {
  #plugins: PluginDefinition[] = []

  register(plugin: PluginDefinition): void {
    this.#plugins.push(plugin)
  }

  get plugins(): ReadonlyArray<PluginDefinition> {
    return [...this.#plugins]
  }

  get brand(): BrandIdentity {
    return this.#plugins.reduce<BrandIdentity>((brand, plugin) => ({ ...brand, ...plugin.brand }), {
      ...defaultBrand,
    })
  }
}
