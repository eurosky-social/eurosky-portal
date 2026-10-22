import type { HttpContext } from '@adonisjs/core/http'
import type { Root } from 'hast'
import legalService from '#services/legal_service'
import type { Jsonify } from '#shared/json'
import { legalValidator } from '#validators/legal'

const titles = { privacy: 'Privacy policy', terms: 'Terms of service' }

export default class LegalController {
  async show({ inertia, request }: HttpContext) {
    const { params } = await request.validateUsing(legalValidator)
    const document = await legalService.getDocument(params.document)
    const tree: Jsonify<Root> = document.tree

    return inertia.render('legal/show', {
      title: inertia.always(titles[params.document]),
      document: inertia.always(tree),
    })
  }
}
