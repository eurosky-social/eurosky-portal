import type { HttpContext } from '@adonisjs/core/http'
import { OAuthResolverError } from '@atproto/oauth-client-node'
import env from '#start/env'
import { loginRequestValidator, signupRequestValidator } from '#validators/oauth'
import { DateTime } from 'luxon'

const oauthServerUrl = env.get('OAUTH_SERVICE')

export default class OAuthController {
  async login({ request, response, inertia, oauth, session, logger }: HttpContext) {
    const { input } = await request.validateUsing(loginRequestValidator)

    try {
      const authorizationUrl = await oauth.authorize(input)

      session.put('source', 'login')
      inertia.location(authorizationUrl)
    } catch (err) {
      logger.error(err, 'Error starting AT Protocol OAuth flow')
      if (err instanceof OAuthResolverError) {
        // Handle the input not being AT Protocol OAuth compatible
        response.abort('Something went wrong')
      }

      response.redirect().back()
    }
  }

  async signup({ request, response, inertia, oauth, session }: HttpContext) {
    await request.validateUsing(signupRequestValidator)

    session.put('source', 'signup')
    session.put('terms_accepted', DateTime.now().toISO())

    // input should be a service URL:
    const registrationSupported = await oauth.canRegister(oauthServerUrl)
    if (!registrationSupported) {
      // Handle registration not supported, this should never be the case for
      // Eurosky:
      return response.abort('Registration not supported')
    }

    const authorizationUrl = await oauth.register(oauthServerUrl)

    inertia.location(authorizationUrl)
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

    session.clear()

    // If we're from signup, but don't have a valid termsAccepted date, we want
    // to cancel the flow:
    const termsAcceptedOn = DateTime.fromISO(termsAccepted)
    if (source === 'signup' && !termsAcceptedOn.isValid) {
      session.flash('error', 'An error occurred during signup')
      return response.redirect().toRoute('account.create')
    }

    try {
      const result = await oauth.handleCallback()

      await result.user.fetchProfile(result.user.did)

      await auth.use('web').login(result.user)

      return response.redirect().toRoute('dashboard.show')
    } catch (err) {
      // Handle OAuth failing
      logger.error(err, 'Error completing AT Protocol OAuth flow')

      if (source === 'signup') {
        return response.redirect().toRoute('account.create')
      }

      return response.redirect().toRoute('home')
    }
  }
}
