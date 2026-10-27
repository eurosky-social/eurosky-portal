import type { HttpContext } from '@adonisjs/core/http'
import { links } from '#shared/links'
import { legalValidator } from '#validators/legal'

export default class LegalController {
  async show({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(legalValidator)
    return response.redirect().status(301).toPath(links[params.document])
  }
}
