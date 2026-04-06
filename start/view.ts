import edge from 'edge.js'
import { edgeMarkdown } from 'edge-markdown'
import env from '#start/env'

const APP_URL = new URL('/', env.get('APP_URL')).toString()

edge.use(edgeMarkdown, {})

edge.global('opengraph_url', (path = '/') => {
  return new URL(path, APP_URL).toString()
})
edge.global('service_domain', new URL(APP_URL).host)
