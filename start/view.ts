import edge from 'edge.js'
import { edgeMarkdown } from 'edge-markdown'
import { appHost, toAbsoluteUrl } from '#services/url_service'
import { brand } from '#shared/brand'

edge.use(edgeMarkdown, {})

edge.global('opengraph_url', toAbsoluteUrl)
edge.global('service_domain', appHost)
edge.global('app_title', brand.appTitle)
