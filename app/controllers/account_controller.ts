import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import TermsAccepted from '#events/terms_accepted'
import WelcomeDismissed from '#events/welcome_dismissed'
import Account from '#models/account'
import legalService from '#services/legal_service'
import env from '#start/env'
import LegalDocumentsTransformer from '#transformers/legal_documents_transformer'
import { termsRequestValidator } from '#validators/legal'

export default class RegistrationController {
  async create({ inertia }: HttpContext) {
    const documents = await legalService.getDocuments()

    return inertia.render('create-account', {
      legalDocuments: inertia.always(LegalDocumentsTransformer.transform(documents)),
      migrationUrl: env.get('MIGRATION_SERVICE'),
    })
  }

  async onboarding({ auth, inertia }: HttpContext) {
    const account = await auth.getUserOrFail().getAccount()
    const documents = await legalService.getDocuments()

    return inertia.render('onboarding', {
      termsUpdated:
        !!account.termsAcceptedAt && account.termsAcceptedAt < documents.terms.effectiveAt,
      privacyUpdated:
        !!account.termsAcceptedAt && account.termsAcceptedAt < documents.privacy.effectiveAt,
      legalDocuments: inertia.always(LegalDocumentsTransformer.transform(documents)),
    })
  }

  async storeAcceptance({ auth, logger, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const account = await user.getAccount()
    const reacceptance = !!account.termsAcceptedAt

    await request.validateUsing(termsRequestValidator)

    await Account.updateOrCreate({ did: user.did }, { termsAcceptedAt: DateTime.now() })

    TermsAccepted.dispatch({
      ip: request.ip(),
      reacceptance,
      userAgent: request.header('user-agent'),
    }).catch((err: unknown) => {
      logger.warn({ err }, 'plausible: cannot track terms accepted')
    })

    return response.redirect().toIntendedRoute('dashboard.show')
  }

  async dismissWelcome({ auth, logger, request, response }: HttpContext) {
    const account = await auth.getUserOrFail().getAccount()
    await account
      .merge({
        welcomeDismissed: true,
      })
      .save()

    WelcomeDismissed.dispatch({
      ip: request.ip(),
      userAgent: request.header('user-agent'),
    }).catch((err: unknown) => {
      logger.warn({ err }, 'plausible: cannot track welcome dismissed')
    })

    return response.ok({ success: true })
  }
}
