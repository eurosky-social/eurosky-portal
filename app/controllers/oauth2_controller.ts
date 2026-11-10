import type { HttpContext } from '@adonisjs/core/http'
import { OAuthCallbackError } from '@atproto/oauth-client-node'
import type { AtprotoUser } from '@thisismissem/adonisjs-atproto-oauth'
import oauth2Service, {
  type Oauth2Error,
  type Oauth2Request,
  type Oauth2Tokens,
} from '#services/oauth2_service'
import { tokenFailures } from '#start/limiter'
import { createState, importScopes, parseScopes, serializeScopes } from '#utils/oauth'
import { flashSessionValue, pullSessionValue, putSessionValue } from '#utils/session'
import { captureException } from '#utils/telemetry'

/**
 * OAuth 2.0 server.
 *
 * Follows what the Data Transfer Project does (see `OAuth2DataGenerator.java`
 * there):
 * the code grant without PKCE,
 * `client_secret_post`,
 * and revoking with the access token as a bearer token.
 */
export default class Oauth2Controller {
  /**
   * Show the consent page.
   */
  async authorize({ auth, inertia, request, response, session }: HttpContext) {
    const client = oauth2Service.getClient()
    const user = auth.getUserOrFail()

    const clientId = getString(request.qs().client_id)
    const redirectUri = getString(request.qs().redirect_uri)
    const responseType = getString(request.qs().response_type)
    const scope = serializeScopes(parseScopes(getString(request.qs().scope)))
    const state = getString(request.qs().state)

    // Do not redirect to unknown URLs.
    if (
      !client ||
      !oauth2Service.isAllowed(user.did) ||
      clientId !== client.id ||
      !redirectUri ||
      !client.redirectUris.includes(redirectUri)
    ) {
      response.status(400)
      return inertia.render('oauth2/authorize', { error: 'invalidClient' as const })
    }

    if (responseType !== 'code') {
      return response.redirect(errorUrl(redirectUri, state, 'unsupported_response_type'))
    }

    putSessionValue(session, 'oauth2_request', { clientId, redirectUri, scope, state })
    const account = await user.getAccount()

    return inertia.render('oauth2/authorize', {
      clientName: client.name,
      handle: account.handle ?? account.did,
    })
  }

  /**
   * Allow or deny, from the consent page.
   *
   * Imports need scopes to write to the repo on the PDS;
   * if they were not granted yet, ask for them first.
   */
  async decide({ auth, i18n, inertia, oauth, request, response, session }: HttpContext) {
    const oauth2Request = pullSessionValue(session, 'oauth2_request')
    const user = auth.getUserOrFail()

    if (!oauth2Service.isAllowed(user.did)) {
      response.status(400)
      return inertia.render('oauth2/authorize', { error: 'invalidClient' as const })
    }

    if (!oauth2Request) {
      flashSessionValue(session, 'errorMessage', { key: 'oauth2.expired' })
      return response.redirect().toRoute('dashboard.show')
    }

    if (request.input('decision') !== 'allow') {
      return inertia.location(errorUrl(oauth2Request.redirectUri, oauth2Request.state))
    }

    const { scope } = await user.getTokenInfo()
    const granted = parseScopes(scope)

    if (granted.isSupersetOf(importScopes)) {
      return inertia.location(await codeUrl(user, oauth2Request))
    }

    // Finished in `oauth2Callback`.
    putSessionValue(session, 'oauth2_intent', oauth2Request)
    const authorizationUrl = await oauth.authorize(user.did, {
      scope: serializeScopes(granted.union(importScopes)),
      state: createState(session),
      ui_locales: i18n.locale,
    })

    return inertia.location(authorizationUrl)
  }

  /**
   * Exchange a code or refresh token for tokens.
   */
  async token({ request, response }: HttpContext) {
    response.header('cache-control', 'no-store')
    response.header('pragma', 'no-cache')

    const clientId = getString(request.input('client_id'))
    const clientSecret = getString(request.input('client_secret'))
    const grantType = getString(request.input('grant_type'))
    const failuresKey = 'oauth2_token_' + request.ip()

    // Too many failures from this IP.
    if (await tokenFailures.isBlocked(failuresKey)) {
      response.header('retry-after', String(await tokenFailures.availableIn(failuresKey)))
      return response.tooManyRequests({ error: 'temporarily_unavailable' } satisfies Oauth2Error)
    }

    const client = oauth2Service.authenticateClient(clientId, clientSecret)

    if (!client) {
      await tokenFailures.increment(failuresKey)
      return response.unauthorized({ error: 'invalid_client' } satisfies Oauth2Error)
    }

    let result: Oauth2Error | Oauth2Tokens

    if (grantType === 'authorization_code') {
      const code = getString(request.input('code'))
      if (!code) return response.badRequest({ error: 'invalid_request' } satisfies Oauth2Error)
      result = await oauth2Service.exchangeCode({
        client,
        code,
        redirectUri: getString(request.input('redirect_uri')),
      })
    } else if (grantType === 'refresh_token') {
      const refreshToken = getString(request.input('refresh_token'))
      if (!refreshToken) {
        return response.badRequest({ error: 'invalid_request' } satisfies Oauth2Error)
      }
      result = await oauth2Service.refresh({ client, refreshToken })
    } else {
      return response.badRequest({ error: 'unsupported_grant_type' } satisfies Oauth2Error)
    }

    if ('error' in result) {
      if (result.error === 'invalid_grant') await tokenFailures.increment(failuresKey)
      return response.badRequest(result)
    }

    return response.ok(result)
  }

  /**
   * Revoke, with the access token as a bearer token.
   *
   * Like RFC 7009, unknown tokens are fine too.
   */
  async revoke({ request, response }: HttpContext) {
    const token = getBearerToken(request.header('authorization'))

    if (!token) {
      return response.unauthorized({ error: 'invalid_token' } satisfies Oauth2Error)
    }

    await oauth2Service.revoke(token)
    return response.ok({})
  }
}

/**
 * Issue a code and get the URL to send the person back to the client with.
 *
 * @param user
 *   User that agreed.
 * @param oauth2Request
 *   Request from the client.
 * @returns
 *   URL.
 */
async function codeUrl(user: AtprotoUser, oauth2Request: Oauth2Request): Promise<string> {
  const code = await oauth2Service.issueCode({
    clientId: oauth2Request.clientId,
    did: user.did,
    redirectUri: oauth2Request.redirectUri,
    scope: oauth2Request.scope,
  })
  const url = new URL(oauth2Request.redirectUri)
  url.searchParams.set('code', code)
  if (oauth2Request.state !== undefined) url.searchParams.set('state', oauth2Request.state)
  return url.href
}

/**
 * Get the URL to send the person back to the client with an error.
 *
 * @param redirectUri
 *   URL of the client.
 * @param state
 *   State from the client.
 * @param error
 *   Error code (default: `'access_denied'`).
 * @returns
 *   URL.
 */
function errorUrl(redirectUri: string, state: string | undefined, error = 'access_denied'): string {
  const url = new URL(redirectUri)
  url.searchParams.set('error', error)
  if (state !== undefined) url.searchParams.set('state', state)
  return url.href
}

/**
 * Get the token from an `Authorization: Bearer` header.
 *
 * @param value
 *   Header value.
 * @returns
 *   Token, if any.
 */
function getBearerToken(value: string | undefined): string | undefined {
  const match = value?.match(/^bearer +(\S+)$/i)
  return match?.[1]
}

/**
 * Get a value if it is a non-empty string.
 *
 * @param value
 *   Value from a query or body.
 * @returns
 *   String, if any.
 */
function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

/**
 * Finish connecting after asking for more scopes on the PDS,
 * whether granted or not;
 * called from the OAuth callback (see `OAuthController`).
 *
 * @param context
 *   Context.
 * @param oauth2Request
 *   Request from the client.
 * @param oauthState
 *   State of the OAuth flow with the PDS.
 */
export async function oauth2Callback(
  { auth, logger, oauth, response, session }: HttpContext,
  oauth2Request: Oauth2Request,
  oauthState: string | undefined
) {
  try {
    const { state, user } = await oauth.handleCallback()

    if (!oauthState || oauthState !== state) {
      throw new Error('OAuth state does not match this session')
    }

    // Another account was chosen;
    // only connect the account that agreed.
    if (user.did !== auth.user?.did || !oauth2Service.isAllowed(user.did)) {
      flashSessionValue(session, 'errorMessage', { key: 'oauth2.otherAccount' })
      return response.redirect().toRoute('dashboard.show')
    }

    const { scope } = await user.getTokenInfo()

    if (!parseScopes(scope).isSupersetOf(importScopes)) {
      return response.redirect(errorUrl(oauth2Request.redirectUri, oauth2Request.state))
    }

    return response.redirect(await codeUrl(user, oauth2Request))
  } catch (err) {
    const denied =
      err instanceof OAuthCallbackError &&
      err.params.get('error')?.toLowerCase() === 'access_denied'

    if (denied) {
      return response.redirect(errorUrl(oauth2Request.redirectUri, oauth2Request.state))
    }

    logger.error({ err }, 'oauth2: cannot finish connecting')
    captureException(err, { tags: { component: 'oauth2' } })

    return response.redirect(
      errorUrl(oauth2Request.redirectUri, oauth2Request.state, 'server_error')
    )
  }
}
