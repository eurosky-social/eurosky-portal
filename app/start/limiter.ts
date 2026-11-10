/*
|--------------------------------------------------------------------------
| Rate limits
|--------------------------------------------------------------------------
|
| Limits for routes that are expensive or could be abused.
| Limited by IP.
|
*/

import limiter from '@adonisjs/limiter/services/main'

/**
 * Logging in and signing up makes requests to the PDS.
 */
export const throttleAuth = limiter.define('auth', function () {
  return limiter.allowRequests(10).every('1 minute')
})

/**
 * Viewing details of activity fetches the record and related things.
 */
export const throttleActivityDetail = limiter.define('activity_detail', function (ctx) {
  return limiter.allowRequests(60).every('1 minute').usingKey(ctx.auth.getUserOrFail().did)
})

/**
 * Favoriting apps lists favorites and writes one.
 */
export const throttleFavorites = limiter.define('favorites', function (ctx) {
  return limiter.allowRequests(30).every('1 minute').usingKey(ctx.auth.getUserOrFail().did)
})

/**
 * Failed requests to the token endpoint of our OAuth 2.0 server.
 * Only for failures as a client is supposed to send a lot of (correct) data.
 * So a wrong secret or an unknown code or refresh token.
 */
export const tokenFailures = limiter.use({ duration: '10 minutes', requests: 10 })
