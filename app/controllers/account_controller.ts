import type { HttpContext } from '@adonisjs/core/http'
import Account from '#models/account'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import { termsRequestValidator } from '#validators/legal'
import LegalDocuments from '#collections/legal'
import LegalDocumentsTransformer from '#transformers/legal_documents_transformer'

export default class RegistrationController {
  private async loadLegalDocuments({ view }: HttpContext) {
    const query = await LegalDocuments.load()
    const documents = query.all()
    const rendered = await Promise.all(
      documents.map((document) => {
        return view.render('markdown', {
          document: app.makePath('data', document.filename),
        })
      })
    )

    return LegalDocumentsTransformer.transform(
      documents.reduce<Record<'terms' | 'privacy', string>>(
        (docs, document, index) => {
          if (document.name === 'terms' || document.name === 'privacy') {
            docs[document.name] = rendered[index]
          }
          return docs
        },
        {
          terms: '',
          privacy: '',
        }
      )
    )
  }

  async create(ctx: HttpContext) {
    const { inertia } = ctx
    const documents = await this.loadLegalDocuments(ctx)

    return inertia.render('create-account', { legalDocuments: inertia.always(documents) })
  }

  async onboarding(ctx: HttpContext) {
    const { inertia } = ctx
    const documents = await this.loadLegalDocuments(ctx)

    return inertia.render('onboarding', { legalDocuments: inertia.always(documents) })
  }

  async storeAcceptance({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    await request.validateUsing(termsRequestValidator, {
      messagesProvider: {
        getMessage(defaultMessage, rule, field) {
          if (rule === 'required' && field.name === 'terms') {
            return 'You must accept the terms of service & privacy policy to continue'
          }
          return defaultMessage
        },
      },
    })

    await Account.updateOrCreate({ did: user.did }, { termsAcceptedAt: DateTime.now() })

    response.redirect().toRoute('dashboard.show')
  }

  async dismissWelcome({ auth, response }: HttpContext) {
    const account = await auth.getUserOrFail().getAccount()
    await account
      .merge({
        welcomeDismissed: true,
      })
      .save()

    return response.ok({ success: true })
  }
}
