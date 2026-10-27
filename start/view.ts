import edge from 'edge.js'
import { edgeMarkdown } from 'edge-markdown'
import { appHost, toAbsoluteUrl } from '#services/url_service'
import { brand } from '#shared/brand'
import { themeColors } from '#shared/theme'

edge.use(edgeMarkdown, {})

edge.global('brand', brand)
edge.global('opengraph_url', toAbsoluteUrl)
edge.global('service_domain', appHost)
edge.global('themeColors', themeColors)
