import edge from 'edge.js'
import { edgeMarkdown } from 'edge-markdown'
import env from '#start/env'

export const appUrl = new URL('/', env.get('APP_URL')).toString()
export const appHost = new URL(appUrl).host

edge.use(edgeMarkdown, {})

edge.global('opengraph_url', toAbsoluteUrl)
edge.global('service_domain', appHost)

export function toAbsoluteUrl(path = '/'): string {
  return new URL(path, appUrl).toString()
}
