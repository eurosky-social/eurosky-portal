import edge from 'edge.js'
import app from '@adonisjs/core/services/app'
import { edgeMarkdown } from 'edge-markdown'
import { defaultBrand } from '#services/plugin_registry'
import PluginRegistry from '#services/plugin_registry'
import { appHost, toAbsoluteUrl } from '#services/url_service'

edge.use(edgeMarkdown, {})

edge.global('opengraph_url', toAbsoluteUrl)
edge.global('service_domain', appHost)
edge.global('portal_brand', { ...defaultBrand })

app.booted(async () => {
  const pluginRegistry = await app.container.make(PluginRegistry)
  edge.global('portal_brand', { ...pluginRegistry.brand })
})
