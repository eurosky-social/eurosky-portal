export interface BrandIdentity {
  name: string
  nameShort: string
  tagline: string
  helpUrl: string
  contactUrl: string
  feedbackUrl?: string
  ecosystemName?: string
}

export interface PluginDefinition {
  id: string
  brand?: Partial<BrandIdentity>
}

export const defaultBrand: BrandIdentity = {
  name: 'Eurosky',
  nameShort: 'Eurosky',
  tagline: 'Your Portal to the Atmosphere',
  helpUrl: 'https://eurosky.tech/help/',
  contactUrl: 'https://eurosky.tech/contact/',
  feedbackUrl: 'https://userinput.app/#/s/did:plc:ooensn4mr5mhznzypvxelfa3/3mr5gmbhteg2p',
  ecosystemName: 'the Atmosphere',
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
