import type { HttpContext } from '@adonisjs/core/http'
import type { I18n } from '@adonisjs/i18n'
import { Monocle } from '@monocle.sh/adonisjs-agent'
import { OAuthCallbackError, OAuthResolverError } from '@atproto/oauth-client-node'
import {
  isUriString,
  asAtIdentifierString,
  type AtIdentifierString,
  type UriString,
  isHandleString,
} from '@atproto/lex'
import { type HandleString, INVALID_HANDLE } from '@atproto/syntax'
import { DateTime } from 'luxon'
import env from '#start/env'
import Account from '#models/account'
import AuthFlowCompleted from '#events/auth_flow_completed'
import AuthFlowStarted from '#events/auth_flow_started'
import AuthLoggedOut from '#events/auth_logged_out'
import activityService from '#services/activity_service'
import jetstreamService from '#services/jetstream_service'
import { SlingshotService } from '#services/slingshot_service'
import { loginRequestValidator, signupRequestValidator } from '#validators/oauth'
import { createFieldError } from '#utils/errors'
import { getHandleDomain } from '#utils/oauth'
import { brand } from '#shared/brand'

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
  'invalid_grant',
]

const WELL_KNOWN_HANDLE_DOMAINS = [
  '.bsky.social',
  '.eurosky.social',
  '.selfhosted.social',
  '.pds.rip',
  // blacksky:
  '.myatproto.social',
  '.blacksky.app',
  '.cryptoanarchy.network',
].filter((domain) => domain !== handleDomain)

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

  async login({ i18n, inertia, logger, oauth, session, request }: HttpContext) {
    const data = await request.validateUsing(loginRequestValidator, {
      meta: {
        handleDomain,
      },
      messagesProvider: {
        getMessage(defaultMessage, rule, field, meta) {
          if (rule === 'at-handle' || rule === 'at-handle-username') {
            return i18n.t('validator.shared.messages.at-handle', {
              domain: handleDomain ?? '.bsky.social',
            })
          }

          return i18n.createMessagesProvider().getMessage(defaultMessage, rule, field, meta)
        },
      },
    })

    const input = normalizeInput(data.input)
    const result = checkAuthInput(input, i18n)
    let resolvedValue: AtIdentifierString | UriString

    if (result.type === 'unresolved') {
      const resolved = await oauth
        .resolveIdentity(result.value, AbortSignal.timeout(1000))
        .catch((err: unknown): undefined => {
          logger.error(err, 'Failed to resolveIdentity for handle: %s', result.value)
        })

      if (!resolved) {
        throw createFieldError(
          'input',
          result.value,
          i18n.t('oauth.accountNotFoundWithFallback', {
            handle: result.value,
            url: oauthServerUrl,
          })
        )
      }

      if (resolved.authorizationServer.toString() !== oauthServerUrl) {
        throw createFieldError(
          'input',
          result.value,
          i18n.t('oauth.unsupportedAccount', {
            appBrand: brand.name,
            appTitle: brand.appTitle,
          })
        )
      }

      resolvedValue = resolved.did
    } else {
      resolvedValue = result.value
    }

    session.put('source', 'login')
    session.put('handle', input)

    try {
      const authorizationUrl = await oauth.authorize(resolvedValue, { ui_locales: i18n.locale })

      AuthFlowStarted.dispatch({
        ip: request.ip(),
        source: 'login',
        userAgent: request.header('user-agent'),
      }).catch((err: unknown) => {
        logger.warn({ err }, 'plausible: cannot track auth flow login started')
      })

      inertia.location(authorizationUrl)
    } catch (err) {
      // We expect this error, which is when the handle doesn't exist:
      if (err instanceof OAuthResolverError) {
        logger.error(err, 'Failed to resolve handle')
        throw createFieldError('input', input, i18n.t('oauth.accountNotFound', { handle: input }))
      }

      Monocle.captureException(err, {
        tags: { component: 'oauth' },
        extra: { source: 'login', input },
      })

      logger.error(err, 'Error starting AT Protocol OAuth flow')
      throw createFieldError('input', input, i18n.t('oauth.unknownError'))
    }
  }

  async signup({ i18n, inertia, logger, oauth, request, session }: HttpContext) {
    await request.validateUsing(signupRequestValidator)

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
      const authorizationUrl = await oauth.register(oauthServerUrl, { ui_locales: i18n.locale })

      AuthFlowStarted.dispatch({
        ip: request.ip(),
        source: 'signup',
        userAgent: request.header('user-agent'),
      }).catch((err: unknown) => {
        logger.warn({ err }, 'plausible: cannot track auth flow signup started')
      })

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

  async logout({ auth, oauth, session, request, response, logger }: HttpContext) {
    await oauth.logout(auth.user?.did)
    await auth.use('web').logout()

    AuthLoggedOut.dispatch({
      ip: request.ip(),
      userAgent: request.header('user-agent'),
    }).catch((err: unknown) => {
      logger.warn({ err }, 'plausible: cannot track logged out')
    })

    session.clear()

    return response.redirect().toRoute('home')
  }

  async callback({ auth, i18n, logger, oauth, request, response, session }: HttpContext) {
    const termsAccepted = session.pull('terms_accepted', 'invalid')
    const source = session.pull('source', 'login')
    const initiatingHandle = session.pull('handle')
    const ip = request.ip()
    const userAgent = request.header('user-agent')

    session.regenerate()

    // Force logout first:
    await auth.use('web').logout()

    // If we're from signup, but don't have a valid termsAccepted date, we want
    // to cancel the flow:
    const termsAcceptedOn = DateTime.fromISO(termsAccepted)
    if (source === 'signup' && !termsAcceptedOn.isValid) {
      Monocle.captureMessage('Invalid datetime for terms accepted from session cookie', {
        level: 'warning',
        tags: { component: 'oauth', type: 'invalid_signup_date' },
        extra: { source, value: termsAccepted },
      })

      session.flash('error', i18n.t('oauth.signupError'))
      AuthFlowCompleted.dispatch({
        ip,
        outcome: 'error',
        source,
        userAgent,
      }).catch((err: unknown) => {
        logger.warn({ err }, 'plausible: cannot track auth flow failed')
      })
      return response.redirect().toRoute('account.create')
    }

    try {
      const result = await oauth.handleCallback()
      const did = result.user.did

      const resolved = await oauth
        .resolveIdentity(did, AbortSignal.timeout(1000))
        .catch((error) => {
          // Timeout.
          if (error instanceof DOMException && error.name === 'AbortError') {
            return
          }

          logger.error(error, 'Failed to resolve handle: %s', did)

          // They *did* complete oauth flow, so this is probably an invalid handle.
          if (error instanceof OAuthResolverError) {
            return { did: did, handle: INVALID_HANDLE as HandleString }
          }

          throw error
        })

      const existingAccount = await Account.findBy({ did })

      // If we don't have an existing account and weren't able to resolve, abort:
      if (!existingAccount && !resolved) {
        await oauth.logout(did)

        session.flash('errorsBag', {
          login_failed: i18n.t('oauth.loginFailed'),
        })

        AuthFlowCompleted.dispatch({
          ip,
          outcome: 'error',
          source,
          userAgent,
        }).catch((err: unknown) => {
          logger.warn({ err }, 'plausible: cannot track auth flow failed')
        })
        return response.redirect().toRoute('auth.login')
      }

      // If we're coming from signup and haven't already logged in, then store
      // that they accepted terms:
      if (source === 'signup' && !existingAccount && resolved) {
        await Account.create({
          did: result.user.did,
          handle: resolved.handle,
          lastActiveAt: DateTime.now(),
          termsAcceptedAt: termsAcceptedOn,
        })
        activityService.dispatchBackfill(result.user.did, ip, userAgent)
      } else if (resolved) {
        const account = await Account.updateOrCreate(
          { did },
          { did, handle: resolved.handle, lastActiveAt: DateTime.now() }
        )
        if (!account.lastActivitySyncAt) {
          activityService.dispatchBackfill(result.user.did, ip, userAgent)
        }
      } else if (existingAccount) {
        await existingAccount.merge({ lastActiveAt: DateTime.now() }).save()
      } else {
        await Account.create({ did, lastActiveAt: DateTime.now() })
      }

      // Every account must be watched (this is a no-op if already watched):
      jetstreamService.addDid(did)

      await auth.use('web').login(result.user)

      AuthFlowCompleted.dispatch({
        ip,
        outcome: 'success',
        source,
        userAgent,
      }).catch((err: unknown) => {
        logger.warn({ err }, 'plausible: cannot track auth flow succeeded')
      })
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
              source === 'signup' ? i18n.t('oauth.cancelledSignup') : i18n.t('oauth.deniedSignIn'),
          })

          AuthFlowCompleted.dispatch({
            ip,
            outcome: 'denied',
            source,
            userAgent,
          }).catch((cause: unknown) => {
            logger.warn({ err: cause }, 'plausible: cannot track auth flow denied')
          })
          return response.redirect().toRoute(source === 'signup' ? 'account.create' : 'auth.login')
        }

        // We do want to capture information about the OAuth server failing:
        if (error === 'server_error') {
          session.flash('errorsBag', {
            server_error:
              source === 'signup' ? i18n.t('oauth.signupServerError') : i18n.t('oauth.loginFailed'),
          })

          Monocle.captureException(err, {
            tags: { component: 'oauth', type: 'server_error' },
            extra: {
              source,
              errorDescription: err.params.get('error_description'),
              handle: initiatingHandle,
            },
          })

          AuthFlowCompleted.dispatch({
            ip,
            outcome: 'error',
            source,
            userAgent,
          }).catch((cause: unknown) => {
            logger.warn({ err: cause }, 'plausible: cannot track auth flow error')
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
        error: i18n.t('oauth.unknownCallbackError'),
      })

      AuthFlowCompleted.dispatch({
        ip,
        outcome: 'error',
        source,
        userAgent,
      }).catch((cause: unknown) => {
        logger.warn({ err: cause }, 'plausible: cannot track auth flow error')
      })
      return response.redirect().toRoute(source === 'signup' ? 'account.create' : 'auth.login')
    }
  }
}

/**
 * Something valid that does not have to be resolved.
 *
 * Such as when external logins are allowed (example: `"did:plc:1234..."`,
 * `"alice.bsky.social"`),
 * or a handle that uses our handle domain (`alice.eurosky.social`).
 */
interface AllowedIdInput {
  type: 'allowed-id'
  value: AtIdentifierString
}

/**
 * OAuth server (example: `https://eurosky.social`).
 */
interface ServiceUrlInput {
  type: 'service-url'
  value: UriString
}

/**
 * Something that looks valid but has to be resolved
 * (example: `alice.example.com`, `did:plc:z72i7hdynmk6r22z27h6tvur`).
 */
interface UnresolvedInput {
  type: 'unresolved'
  value: AtIdentifierString
}

/**
 * Checks the type of input (URI, handle, or DID);
 * classifies as allowed ID (does not need to be resolved), a service URL, or
 * an unresolved value.
 *
 * > **Note**: input value is *not* touched, only classified in types.
 *
 * @param value
 *   Normalized input.
 * @returns
 *   Classified input.
 * @throws
 *   When known invalid input is used.
 */
function checkAuthInput(
  value: string,
  i18n: I18n
): AllowedIdInput | ServiceUrlInput | UnresolvedInput {
  // OAuth server (example: `https://eurosky.social`).
  if (isUriString(value)) {
    // Reject early if external logins are not allowed (example:
    // `https://bsky.social`).
    if (
      allowExternalLogins !== true &&
      // We need to remove any trailing slashes to normalize:
      value.toLowerCase().replace(/\/$/, '') !== oauthServerUrl.toLowerCase().replace(/\/$/, '')
    ) {
      throw createFieldError(
        'input',
        value,
        i18n.t('oauth.unsupportedAccount', {
          appBrand: brand.name,
          appTitle: brand.appTitle,
        })
      )
    }

    return { type: 'service-url', value }
  }

  // Error early for non-did and non-handle.
  if (!isIdentifier(value)) {
    throw createFieldError('input', value, i18n.t('oauth.invalidAccount'))
  }

  // Externals allowed, so any identifier goes (example: `"did:plc:1234..."`, `"alice.bsky.social"`).
  if (allowExternalLogins === true) {
    return { type: 'allowed-id', value }
  }

  // Handle configured, we can check it early (example: `alice.eurosky.social`).
  if (handleDomain && isHandleString(value)) {
    // We know these are not us.
    // Note that `handleDomain` is already filtered out.
    if (WELL_KNOWN_HANDLE_DOMAINS.some((serviceDomain) => value.endsWith(serviceDomain))) {
      throw createFieldError(
        'input',
        value,
        i18n.t('oauth.unsupportedAccount', {
          appBrand: brand.name,
          appTitle: brand.appTitle,
        })
      )
    }

    if (value.endsWith(handleDomain)) {
      return { type: 'allowed-id', value }
    }

    // Another handle, like `example.com`.
  }

  // A DID, or a handle on a domain we don't recognize: only the network can
  // tell us its authorization server.
  return { type: 'unresolved', value }
}

/**
 * Normalizes input values.
 *
 * @param input
 *   Input value to normalize.
 * @returns
 *   Normalized value.
 */
function normalizeInput(input: string): string {
  let result = input

  // Convert a bare username into a full handle.
  // `alice` > `alice.eurosky.social`.
  if (handleDomain && !isIdentifier(result) && !isUriString(result)) {
    result += handleDomain
  }

  // Handles are case-insensitive but canonically lowercase;
  // unlike DIDs and URIs.
  // `Alice.Eurosky.Social` > `alice.eurosky.social`.
  if (isHandleString(result)) {
    result = result.toLowerCase()
  }

  // Common typo.
  // `alice.bluesky.social` > `alice.bsky.social`.
  if (result.endsWith('.bluesky.social')) {
    result = result.replace('.bluesky.social', '.bsky.social')
  }

  return result
}
