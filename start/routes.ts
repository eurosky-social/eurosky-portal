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
    router.get('/onboarding', [controllers.Account, 'onboarding'])
    router.post('/onboarding', [controllers.Account, 'storeAcceptance'])
  })
  .use([middleware.auth(), middleware.legalRoadblock()])

router.get('/legal/:document', [controllers.Legal, 'show'])
