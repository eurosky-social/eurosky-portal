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

router.on('/').renderInertia('home', {}).as('home')

router
  .group(() => {
    router.get('/create-account', [controllers.Account, 'create'])
  })
  .use(middleware.guest())

router
  .group(() => {
    // authenticated routes
  })
  .use(middleware.auth())
