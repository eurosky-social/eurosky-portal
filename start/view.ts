import edge from 'edge.js'
import { edgeMarkdown } from 'edge-markdown'
import { appHost, toAbsoluteUrl } from '#services/url_service'

edge.use(edgeMarkdown, {})

edge.global('opengraph_url', toAbsoluteUrl)
edge.global('service_domain', appHost)
