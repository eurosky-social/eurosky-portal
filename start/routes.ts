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
    router.get('/dashboard', [controllers.Dashboard, 'show'])
    router.on('/dashboard/explore').redirectToPath('/explore/learn-more')
    router.get('/explore/learn-more', [controllers.Explore, 'learnMore'])
    router.get('/activity', [controllers.Activity, 'show'])
    router.get('/activity/:collection/:rkey', [controllers.Activity, 'detail'])
    router.get('/onboarding', [controllers.Account, 'onboarding'])
    router.post('/onboarding', [controllers.Account, 'storeAcceptance'])
    router.post('/account/dismiss-welcome', [controllers.Account, 'dismissWelcome'])
  })
  .use([middleware.auth(), middleware.legalRoadblock()])

router.get('/apps', [controllers.Discover, 'apps'])
router.get('/apps/:rkey', [controllers.Discover, 'app'])
router.get('/legal/:document', [controllers.Legal, 'show'])
router.get('/faq', [controllers.Faq, 'show'])

router.get('/_health', [controllers.HealthChecks, 'live'])
router.get('/_readiness', [controllers.HealthChecks, 'ready'])
