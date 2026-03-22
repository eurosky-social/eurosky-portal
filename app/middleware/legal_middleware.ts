import Account from '#models/account'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import LegalDocuments from '#collections/legal'

export default class LegalMiddleware {
  async handle({ request, response, auth, session }: HttpContext, next: NextFn) {
    const user = auth.getUserOrFail()
    const account = await Account.findBy({ did: user.did })

    const query = await LegalDocuments.load()
    const document = query.findByName('terms')

    if (!document) {
      return response.internalServerError('Missing terms of service document')
    }

    const termsAccepted =
      account && account.termsAcceptedAt && account.termsAcceptedAt >= document.updatedAt

    if (request.url().startsWith('/onboarding')) {
      if (termsAccepted) {
        return response.redirect().toRoute('dashboard.show')
      }

      return await next()
    }

    if (!termsAccepted) {
      session.flash('prevUrl', request.url())
      return response.redirect().toRoute('account.onboarding')
    }

    return await next()
  }
}
