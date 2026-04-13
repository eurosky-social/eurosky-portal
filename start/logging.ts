import emitter from '@adonisjs/core/services/emitter'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import app from '@adonisjs/core/services/app'

const NS_PER_SEC = 1e9
const MS_PER_SEC = 1e6

emitter.on('http:server_ready', () => {
  logger.info(`Server available at: ${env.get('APP_URL')}`)
})

const ignoredUrlPrefixes = [
  '/resources',
  '/.adonisjs',
  '/inertia',
  '/@',
  '/node_modules',
  '/favicon.ico',
  '/installHook.js.map',
]

emitter.on('http:request_completed', ({ ctx, duration }) => {
  const { request, response } = ctx
  const requestUrl = request.url()

  // Don't log request for health checks:
  if (requestUrl === '/health') {
    return
  }

  // Don't log request for static assets:
  if (ignoredUrlPrefixes.some((prefix) => requestUrl.startsWith(prefix))) {
    return
  }

  const responseTime = (duration[0] * NS_PER_SEC + duration[1]) / MS_PER_SEC
  const responseStatus = response.getStatus()

  let location
  if (!app.inProduction && responseStatus >= 300 && responseStatus < 400) {
    location = response.getHeader('Location')
  }

  ctx.logger.info(
    {
      response_time: responseTime,
      status: responseStatus,
      query: request.qs(),
      location,
    },
    `request ${ctx.request.method()} ${ctx.request.url()} status=${ctx.response.getStatus()} rt=${responseTime}`
  )
})
