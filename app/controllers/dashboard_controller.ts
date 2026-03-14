import type { HttpContext } from '@adonisjs/core/http'

export default class DashboardController {
  async show({ inertia }: HttpContext) {
    return inertia.render('dashboard/show', {})
  }
}
