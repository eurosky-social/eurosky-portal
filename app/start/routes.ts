/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'
import { throttleActivityDetail, throttleFavorites } from '#start/limiter'
import '#start/routes/oauth'

router
  .group(() => {
    router.get('/', [controllers.Home, 'show']).as('home')
    router.get('/create-account', [controllers.Account, 'create'])
    router.get('/login', [controllers.Auth, 'login'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('/account/dismiss-welcome', [controllers.Account, 'dismissWelcome'])
    router.get('/activity', [controllers.Activity, 'show'])
    router
      .get('/activity/:collection/:rkey', [controllers.Activity, 'detail'])
      .use(throttleActivityDetail)
    router.post('/apps/:rkey/favorite', [controllers.Discover, 'favorite']).use(throttleFavorites)
    router
      .delete('/apps/:rkey/favorite', [controllers.Discover, 'unfavorite'])
      .use(throttleFavorites)
    router.get('/connections', [controllers.Connections, 'show'])
    router.delete('/connections/:clientId', [controllers.Connections, 'destroy'])
    router.get('/dashboard', [controllers.Dashboard, 'show'])
    router.get('/dashboard/apps', [controllers.Dashboard, 'apps'])
    router.get('/files', [controllers.Files, 'show'])
    router.get('/oauth2/authorize', [controllers.Oauth2, 'authorize']).as('oauth2.authorize')
    router.post('/oauth2/authorize', [controllers.Oauth2, 'decide']).as('oauth2.decide')
    router.get('/onboarding', [controllers.Account, 'onboarding'])
    router.post('/onboarding', [controllers.Account, 'storeAcceptance'])
  })
  .use([middleware.auth(), middleware.legalRoadblock()])

router.get('/_health', [controllers.HealthChecks, 'live'])
router.get('/_readiness', [controllers.HealthChecks, 'ready'])
router.get('/apps', [controllers.Discover, 'apps'])
router.get('/apps/:rkey', [controllers.Discover, 'app'])
router.on('/dashboard/explore').redirectToPath('/explore/learn-more')
router.get('/explore/learn-more', [controllers.Explore, 'learnMore'])
router.get('/faq', [controllers.Faq, 'show'])
router.get('/legal/:document', [controllers.Legal, 'show'])
router.post('/oauth2/revoke', [controllers.Oauth2, 'revoke']).as('oauth2.revoke')
router.post('/oauth2/token', [controllers.Oauth2, 'token']).as('oauth2.token')
