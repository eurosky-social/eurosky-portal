import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'

export default class AuthController {
  async login({ inertia }: HttpContext) {
    return inertia.render('login', {
      migrationUrl: env.get('MIGRATION_SERVICE'),
    })
  }
}
