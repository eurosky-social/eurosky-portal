import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import legalService from '#services/legal_service'
import { DateTime } from 'luxon'

export default class LegalMiddleware {
  async handle({ auth, i18n, request, response }: HttpContext, next: NextFn) {
    const account = await auth.getUserOrFail().getAccount()

    let documents
    try {
      documents = await legalService.getDocuments()
    } catch {
      return response.internalServerError(i18n.t('legal.loadError'))
    }

    const now = DateTime.now()
    const acceptanceRequired =
      // if we haven't accepted legal documents yet:
      account.termsAcceptedAt === null ||
      // or the Terms have updated today or in the past
      (account.termsAcceptedAt < documents.terms.effectiveAt &&
        now >= documents.terms.effectiveAt) ||
      // or the Privacy policy has updated today or in the past
      (account.termsAcceptedAt < documents.privacy.effectiveAt &&
        now >= documents.privacy.effectiveAt)

    const isOnboarding = request.url().startsWith('/onboarding')
    if (!acceptanceRequired && isOnboarding) {
      return response.redirect().toRoute('dashboard.show')
    }

    if (acceptanceRequired && !isOnboarding) {
      return response.redirect().withIntendedUrl().toRoute('account.onboarding')
    }

    return await next()
  }
}
