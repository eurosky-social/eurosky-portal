import { test } from '@japa/runner'
import PluginRegistry, { defaultBrand } from '#services/plugin_registry'

test.group('PluginRegistry', () => {
  test('uses the default brand when no plugin is registered', ({ assert }) => {
    const registry = new PluginRegistry()

    assert.deepEqual(registry.brand, defaultBrand)
  })

  test('overrides the default brand with a plugin brand', ({ assert }) => {
    const registry = new PluginRegistry()

    registry.register({
      id: 'example',
      brand: {
        name: 'Example Co.',
        nameShort: 'Example',
        taglineLead: 'A portal for',
        helpUrl: 'https://example.com/help',
        contactUrl: 'https://example.com/contact',
      },
    })

    assert.deepEqual(registry.brand, {
      ...defaultBrand,
      name: 'Example Co.',
      nameShort: 'Example',
      taglineLead: 'A portal for',
      helpUrl: 'https://example.com/help',
      contactUrl: 'https://example.com/contact',
    })
  })

  test('preserves defaults for unspecified brand values', ({ assert }) => {
    const registry = new PluginRegistry()

    registry.register({
      id: 'example',
      brand: { name: 'Example Co.' },
    })

    assert.equal(registry.brand.name, 'Example Co.')
    assert.equal(registry.brand.taglineLead, defaultBrand.taglineLead)
    assert.equal(registry.brand.helpUrl, defaultBrand.helpUrl)
  })

  test('lets later plugins override earlier brand values', ({ assert }) => {
    const registry = new PluginRegistry()

    registry.register({ id: 'first', brand: { name: 'First' } })
    registry.register({ id: 'second', brand: { name: 'Second' } })

    assert.equal(registry.brand.name, 'Second')
  })

  test('returns a copy of the registered plugins', ({ assert }) => {
    const registry = new PluginRegistry()
    registry.register({ id: 'example' })

    const plugins = registry.plugins as Array<{ id: string }>
    plugins.length = 0

    assert.lengthOf(registry.plugins, 1)
  })
})
