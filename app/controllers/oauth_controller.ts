import type { HttpContext } from '@adonisjs/core/http'
import { Monocle } from '@monocle.sh/adonisjs-agent'
import { OAuthResolverError } from '@atproto/oauth-client-node'
import { isUriString, asAtIdentifierString, type AtIdentifierString } from '@atproto/lex'
import { DateTime } from 'luxon'
import env from '#start/env'
import Account from '#models/account'
import { SlingshotService } from '#services/slingshot_service'
import { loginRequestValidator, signupRequestValidator } from '#validators/oauth'
import { createFieldError } from '#utils/errors'

const oauthServerUrl = env.get('OAUTH_SERVICE')
const allowExternalLogins = env.get('ALLOW_EXTERNAL_LOGINS', false)
const handleDomain = getHandleDomain()

function getHandleDomain(): string | undefined {
  let value = env.get('ATPROTO_HANDLE_DOMAIN')
  if (!value) {
    return undefined
  }
  if (value.startsWith('.')) {
    return value
  }
  return '.' + value
}

function isIdentifier(input: string): input is AtIdentifierString {
  try {
    asAtIdentifierString(input)
    return true
  } catch (error) {
    return false
  }
}

export default class OAuthController {
  protected slingshot: SlingshotService

  constructor() {
    this.slingshot = new SlingshotService()
  }

  async login({ request, inertia, oauth, session, logger }: HttpContext) {
    const data = await request.validateUsing(loginRequestValidator)
    let input = data.input

    if (!isIdentifier(input) && !isUriString(input)) {
      if (!handleDomain) {
        throw createFieldError('input', input, 'Please enter a handle')
      }
      input += handleDomain
    }

    if (allowExternalLogins !== true) {
      // the validation is accepting handles, dids, and services, so we need to
      // assert we only have a handle or did string here:
      if (!isIdentifier(input)) {
        throw createFieldError('input', input, 'Please enter a handle')
      }

      const resolved = await oauth.resolveIdentity(input)
      if (!resolved) {
        throw createFieldError('input', input, 'Failed to resolve identity')
      }

      if (resolved.authorizationServer.toString() !== oauthServerUrl) {
        throw createFieldError(
          'input',
          input,
          'Currently the Eurosky portal is only available for Eurosky accounts. We are planning to extend availability to other Atmosphere accounts in the coming months.'
        )
      }
    }

    try {
      const authorizationUrl = await oauth.authorize(input)

      session.put('source', 'login')
      inertia.location(authorizationUrl)
    } catch (err) {
      // We expect this error, which is when the handle doesn't exist:
      if (err instanceof OAuthResolverError) {
        throw createFieldError('input', input, err.message)
      }

      Monocle.captureException(err, {
        tags: { component: 'oauth' },
        extra: { source: 'login' },
      })

      logger.error(err, 'Error starting AT Protocol OAuth flow')
      throw createFieldError('input', input, 'Unknown error occurred')
    }
  }

  async signup({ request, response, inertia, oauth, session, logger }: HttpContext) {
    await request.validateUsing(signupRequestValidator, {
      messagesProvider: {
        getMessage(defaultMessage, rule, field) {
          if (rule === 'required' && field.name === 'terms') {
            return 'You must accept the terms of service & privacy policy to continue'
          }
          return defaultMessage
        },
      },
    })

    session.put('source', 'signup')
    session.put('terms_accepted', DateTime.now().toISO())

    // input should be a service URL:
    const registrationSupported = await oauth.canRegister(oauthServerUrl)
    if (!registrationSupported) {
      // Handle registration not supported, this should never be the case for
      // Eurosky:
      return response.abort('Registration not supported')
    }

    try {
      const authorizationUrl = await oauth.register(oauthServerUrl)

      inertia.location(authorizationUrl)
    } catch (err) {
      Monocle.captureException(err, {
        tags: { component: 'oauth' },
        extra: { source: 'login' },
      })

      logger.error(err, 'Error starting AT Protocol OAuth flow')
      throw err
    }
  }

  async logout({ auth, oauth, session, response }: HttpContext) {
    await oauth.logout(auth.user?.did)
    await auth.use('web').logout()

    session.clear()

    return response.redirect().toRoute('home')
  }

  async callback({ response, oauth, auth, session, logger }: HttpContext) {
    const termsAccepted = session.pull('terms_accepted', 'invalid')
    const source = session.pull('source', 'login')

    session.regenerate()

    // If we're from signup, but don't have a valid termsAccepted date, we want
    // to cancel the flow:
    const termsAcceptedOn = DateTime.fromISO(termsAccepted)
    if (source === 'signup' && !termsAcceptedOn.isValid) {
      Monocle.captureMessage('Invalid datetime for terms accepted from session cookie', {
        level: 'warning',
        tags: { component: 'oauth' },
        extra: { source, value: termsAccepted },
      })

      session.flash('error', 'An error occurred during signup')
      return response.redirect().toRoute('account.create')
    }

    try {
      const result = await oauth.handleCallback()
      const did = result.user.did

      const resolved = await this.slingshot.resolveMiniDoc(did, AbortSignal.timeout(1000))
      const existingAccount = await Account.findBy({ did })

      if (!resolved) {
        await oauth.logout(did)
        return response.redirect().toRoute(source === 'signup' ? 'account.create' : 'auth.login')
      }

      // If we're coming from signup, then store that they accepted terms:
      if (source === 'signup' && !existingAccount) {
        await Account.create({
          did: result.user.did,
          handle: resolved.handle,
          termsAcceptedAt: termsAcceptedOn,
        })
      } else {
        await Account.updateOrCreate({ did }, { did, handle: resolved.handle })
      }

      await auth.use('web').login(result.user)

      return response.redirect().toIntendedRoute('dashboard.show')
    } catch (err) {
      // Handle OAuth failing
      logger.error(err, 'Error completing AT Protocol OAuth flow')

      Monocle.captureException(err, {
        tags: { component: 'oauth' },
        extra: { source },
      })

      if (source === 'signup') {
        return response.redirect().toRoute('account.create')
      }

      return response.redirect().toRoute('auth.login')
    }
  }
}
