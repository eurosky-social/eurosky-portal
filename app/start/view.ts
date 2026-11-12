import edge from 'edge.js'
import { appHost, toAbsoluteUrl } from '#services/url_service'
import { brand } from '#shared/brand'
import { themeColors } from '#shared/theme'

edge.global('brand', brand)
edge.global('opengraph_url', toAbsoluteUrl)
edge.global('service_domain', appHost)
edge.global('themeColors', themeColors)
