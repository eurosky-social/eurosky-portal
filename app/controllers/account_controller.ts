import type { HttpContext } from '@adonisjs/core/http'

export default class RegistrationController {
  async create({ inertia }: HttpContext) {
    return inertia.render('create-account', {})
  }
}
