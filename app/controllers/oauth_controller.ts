import type { HttpContext } from '@adonisjs/core/http'
import { Monocle } from '@monocle.sh/adonisjs-agent'
import { OAuthCallbackError, OAuthResolverError } from '@atproto/oauth-client-node'
import { isUriString, asAtIdentifierString, type AtIdentifierString } from '@atproto/lex'
import { INVALID_HANDLE } from '@atproto/syntax'
import { DateTime } from 'luxon'
import env from '#start/env'
import Account from '#models/account'
import { SlingshotService } from '#services/slingshot_service'
import { loginRequestValidator, signupRequestValidator } from '#validators/oauth'
import { createFieldError } from '#utils/errors'

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

const oauthServerUrl = env.get('OAUTH_SERVICE')
const allowExternalLogins = env.get('ALLOW_EXTERNAL_LOGINS', false)
const handleDomain = getHandleDomain()

const KNOWN_OAUTH_ERRORS = [
  'login_required',
  'invalid_scope',
  'invalid_authorization_details',
  'consent_required',
  'invalid_request',
  'server_error',
  'account_selection_required',
  'access_denied',
]

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
    const data = await request.validateUsing(loginRequestValidator, {
      meta: {
        handleDomain,
      },
    })

    let input = data.input

    if (!isIdentifier(input) && !isUriString(input)) {
      if (!handleDomain) {
        throw createFieldError('input', input, 'Please enter a handle')
      }
      input += handleDomain
    }

    if (allowExternalLogins !== true && handleDomain && !input.endsWith(handleDomain)) {
      // the validation is accepting handles, dids, and services, so we need to
      // assert we only have a handle or did string here:
      if (!isIdentifier(input)) {
        throw createFieldError('input', input, 'Please enter a handle')
      }

      const resolved = await oauth
        .resolveIdentity(input, AbortSignal.timeout(1000))
        .catch((err) => {
          logger.error(err, 'Failed to resolveIdentity for handle: %s', input)
          return undefined
        })

      if (!resolved || resolved.authorizationServer.toString() !== oauthServerUrl) {
        throw createFieldError(
          'input',
          input,
          'Currently the Eurosky portal is only available for Eurosky accounts.'
        )
      }
    }

    session.put('source', 'login')
    session.put('handle', input)

    try {
      const authorizationUrl = await oauth.authorize(input)

      inertia.location(authorizationUrl)
    } catch (err) {
      // We expect this error, which is when the handle doesn't exist:
      if (err instanceof OAuthResolverError) {
        throw createFieldError('input', input, err.message)
      }

      Monocle.captureException(err, {
        tags: { component: 'oauth' },
        extra: { source: 'login', input },
      })

      logger.error(err, 'Error starting AT Protocol OAuth flow')
      throw createFieldError('input', input, 'Unknown error occurred')
    }
  }

  async signup({ request, inertia, oauth, session, logger }: HttpContext) {
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

    // This only makes sense when accepting user input for the oauthServerUrl,
    // which was what we originally had for sign-up, but that isn't the case in
    // deployed servers, where we lock to a specific OAuth Service
    //
    // const registrationSupported = await oauth.canRegister(oauthServerUrl)
    // if (!registrationSupported) {
    // // Handle registration not supported, this should never be the case for Eurosky:
    //   return response.abort('Registration not supported')
    // }

    try {
      const authorizationUrl = await oauth.register(oauthServerUrl)

      inertia.location(authorizationUrl)
    } catch (err) {
      Monocle.captureException(err, {
        tags: { component: 'oauth' },
        extra: { source: 'signup' },
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
    const initiatingHandle = session.pull('handle')

    session.regenerate()

    // If we're from signup, but don't have a valid termsAccepted date, we want
    // to cancel the flow:
    const termsAcceptedOn = DateTime.fromISO(termsAccepted)
    if (source === 'signup' && !termsAcceptedOn.isValid) {
      Monocle.captureMessage('Invalid datetime for terms accepted from session cookie', {
        level: 'warning',
        tags: { component: 'oauth', type: 'invalid_signup_date' },
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
        logger.info({ did }, 'Failed to resolve handle')
      }

      const handle = resolved?.handle ?? INVALID_HANDLE

      // If we're coming from signup and haven't already logged in, then store
      // that they accepted terms:
      if (source === 'signup' && !existingAccount) {
        await Account.create({
          did: result.user.did,
          handle: handle,
          termsAcceptedAt: termsAcceptedOn,
        })
      } else {
        await Account.updateOrCreate({ did }, { did, handle: handle })
      }

      await auth.use('web').login(result.user)

      return response.redirect().toIntendedRoute('dashboard.show')
    } catch (err) {
      if (err instanceof OAuthCallbackError) {
        // The error parameter indicates either access_denied (user denied the
        // request or it timed out, or server_error where something internally
        // went wrong in the OAuth server)
        const error = err.params.get('error')?.toLowerCase()

        // If the user denied the authorization request, or it timed out, this
        // doesn't need an explicit capture:
        if (error === 'access_denied') {
          session.flash('errorsBag', {
            access_denied:
              source === 'signup'
                ? 'You cancelled creating your account'
                : 'You denied the sign in attempt',
          })

          return response.redirect().toRoute(source === 'signup' ? 'account.create' : 'auth.login')
        }

        // We do want to capture information about the OAuth server failing:
        if (error === 'server_error') {
          session.flash('errorsBag', {
            server_error:
              source === 'signup'
                ? "We couldn't create your account at this time, please try again later."
                : "We couldn't sign you in at this time, please try again later.",
          })

          Monocle.captureException(err, {
            tags: { component: 'oauth', type: 'server_error' },
            extra: {
              source,
              errorDescription: err.params.get('error_description'),
              handle: initiatingHandle,
            },
          })

          return response.redirect().toRoute(source === 'signup' ? 'account.create' : 'auth.login')
        }

        // Capture all other OAuthCallbackErrors, including the `error` parameter if available:
        Monocle.captureException(err, {
          tags: {
            component: 'oauth',
            type: error && KNOWN_OAUTH_ERRORS.includes(error) ? error : 'unknown_error',
          },
          extra: {
            source,
            errorDescription: err.params.get('error_description'),
            handle: initiatingHandle,
          },
        })
      } else {
        // Handle OAuth failing
        logger.error(err, 'Unknown error completing OAuth callback')

        Monocle.captureException(err, {
          tags: { component: 'oauth', type: 'unknown' },
          extra: {
            source,
            handle: initiatingHandle,
          },
        })
      }

      session.flash('errorsBag', {
        error: 'An unknown error occurred, please try again later.',
      })

      return response.redirect().toRoute(source === 'signup' ? 'account.create' : 'auth.login')
    }
  }
}
