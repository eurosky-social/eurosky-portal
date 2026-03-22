import type { HttpContext } from '@adonisjs/core/http'
import { legalValidator } from '#validators/legal'
import app from '@adonisjs/core/services/app'
import LegalDocuments from '#collections/legal'

export default class LegalController {
  async show({ request, response, inertia, view }: HttpContext) {
    const { params } = await request.validateUsing(legalValidator)
    const query = await LegalDocuments.load()
    const document = query.findByName(params.document)

    if (!document) {
      return response.notFound()
    }

    const renderedHtml = await view.render('legal', {
      document: app.makePath('data', document?.filename),
    })

    return inertia.render('legal/show', {
      document: inertia.always(renderedHtml),
    })
  }
}
