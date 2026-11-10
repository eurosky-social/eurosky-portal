import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { l } from '@atproto/lex'
import { DateTime } from 'luxon'
import Oauth2Grant from '#models/oauth2_grant'
import env from '#start/env'

/**
 * Client of our OAuth 2.0 server.
 */
export interface Oauth2Client {
  /**
   * Page on its site where people start connecting, if any.
   */
  connectUrl: string | undefined

  /**
   * ID (`client_id`).
   */
  id: string

  /**
   * Name, shown to people.
   */
  name: string

  /**
   * URLs it may redirect to, matched exactly.
   */
  redirectUris: ReadonlyArray<string>

  /**
   * Secret (`client_secret`).
   */
  secret: string
}

/**
 * Connected service, as shown to people.
 */
export interface Oauth2Connection {
  /**
   * Client ID.
   */
  clientId: string

  /**
   * When it was first connected (ISO 8601).
   */
  createdAt: string

  /**
   * Name of the client.
   */
  name: string
}

/**
 * Error, as defined in RFC 6749 and by the Data Transfer Project
 * (`session_invalidated`, which stops all transfers of a token).
 */
export interface Oauth2Error {
  error:
    | 'invalid_client'
    | 'invalid_grant'
    | 'invalid_request'
    | 'invalid_token'
    | 'session_invalidated'
    | 'temporarily_unavailable'
    | 'unsupported_grant_type'
}

/**
 * Authorization request of a client, kept in the session while the person
 * agrees (and maybe grants more scopes on their PDS);
 * see `Oauth2Controller`.
 */
export interface Oauth2Request {
  /**
   * Client ID.
   */
  clientId: string

  /**
   * Where to send the person back to.
   */
  redirectUri: string

  /**
   * Space-separated scopes the client asked for, sorted.
   */
  scope: string

  /**
   * Value to pass back to the client, if any.
   */
  state: string | undefined
}

/**
 * Tokens, as sent to clients.
 */
export interface Oauth2Tokens {
  access_token: string
  expires_in: number
  refresh_token: string
  scope: string
  token_type: 'Bearer'
}

/**
 * Issue and check codes and tokens of our OAuth 2.0 server, which lets a
 * data transfer service import into the repos of people.
 *
 * Tokens are random,
 * only their hashes are stored,
 * and they work until the person disconnects the service.
 */
export class Oauth2Service {
  /**
   * Check a client ID and secret.
   *
   * @param clientId
   *   Client ID.
   * @param clientSecret
   *   Client secret.
   * @returns
   *   Client if valid.
   */
  authenticateClient(
    clientId: string | undefined,
    clientSecret: string | undefined
  ): Oauth2Client | undefined {
    const client = this.getClient()

    if (
      client &&
      clientId === client.id &&
      clientSecret !== undefined &&
      // Hashes have the same length, as `timingSafeEqual` needs.
      timingSafeEqual(hash(clientSecret), hash(client.secret))
    ) {
      return client
    }
  }

  /**
   * Exchange a code for tokens (`authorization_code` grant);
   * a code works once.
   *
   * @param options
   *   Configuration.
   * @returns
   *   Tokens or error.
   */
  async exchangeCode(options: {
    client: Oauth2Client
    code: string
    redirectUri: string | undefined
  }): Promise<Oauth2Error | Oauth2Tokens> {
    // Remove code first so it works once even when the rest fails.
    const rows: Array<Record<string, unknown>> = await Oauth2Grant.query()
      .where('codeHash', hashToken(options.code))
      .update({ code_hash: null }, ['*'])
    const grant = rows[0] ? Oauth2Grant.$createFromAdapterResult(rows[0]) : null

    if (
      !grant ||
      !grant.codeExpiresAt ||
      grant.codeExpiresAt < DateTime.now() ||
      grant.clientId !== options.client.id ||
      grant.redirectUri !== options.redirectUri ||
      grant.revokedAt ||
      !this.isAllowed(grant.did)
    ) {
      return { error: 'invalid_grant' }
    }

    const accessToken = createToken()
    const refreshToken = createToken()

    await grant
      .merge({
        accessTokenExpiresAt: DateTime.now().plus({ seconds: accessTokenLifetime }),
        accessTokenHash: hashToken(accessToken),
        codeExpiresAt: null,
        refreshTokenHash: hashToken(refreshToken),
      })
      .save()

    return toTokens(grant, accessToken, refreshToken)
  }

  /**
   * Get the client, if configured.
   *
   * @returns
   *   Client.
   */
  getClient(): Oauth2Client | undefined {
    const connectUrl = env.get('OAUTH2_CLIENT_CONNECT_URL')
    const id = env.get('OAUTH2_CLIENT_ID')
    const name = env.get('OAUTH2_CLIENT_NAME')
    const redirectUris = env.get('OAUTH2_CLIENT_REDIRECT_URIS')
    const secret = env.get('OAUTH2_CLIENT_SECRET')?.release()

    if (id && secret && redirectUris && redirectUris.length > 0) {
      return { connectUrl, id, name: name ?? id, redirectUris, secret }
    }
  }

  /**
   * Check whether a person can connect services;
   * while `OAUTH2_ALLOWED_DIDS` is set, only those can (such as to test before
   * launch).
   *
   * @param did
   *   DID of the person.
   * @returns
   *   Whether they can.
   */
  isAllowed(did: l.DidString): boolean {
    const allowed = env.get('OAUTH2_ALLOWED_DIDS')
    return !allowed || allowed.includes(did)
  }

  /**
   * Issue a code, after the person agreed.
   *
   * @param options
   *   Configuration.
   * @returns
   *   Code.
   */
  async issueCode(options: {
    clientId: string
    did: l.DidString
    redirectUri: string
    scope: string
  }): Promise<string> {
    const code = createToken()

    await Oauth2Grant.create({
      clientId: options.clientId,
      codeExpiresAt: DateTime.now().plus({ seconds: codeLifetime }),
      codeHash: hashToken(code),
      did: options.did,
      redirectUri: options.redirectUri,
      scope: options.scope,
    })

    return code
  }

  /**
   * Get a new access token (`refresh_token` grant).
   *
   * Refresh tokens are not rotated:
   * the Data Transfer Project keeps the old one when no new one comes back,
   * and a retried request then still works.
   *
   * @param options
   *   Configuration.
   * @returns
   *   Tokens or error.
   */
  async refresh(options: {
    client: Oauth2Client
    refreshToken: string
  }): Promise<Oauth2Error | Oauth2Tokens> {
    const grant = await Oauth2Grant.findBy({ refreshTokenHash: hashToken(options.refreshToken) })

    if (
      !grant ||
      grant.clientId !== options.client.id ||
      grant.revokedAt ||
      !this.isAllowed(grant.did)
    ) {
      return { error: 'invalid_grant' }
    }

    const accessToken = createToken()

    await grant
      .merge({
        accessTokenExpiresAt: DateTime.now().plus({ seconds: accessTokenLifetime }),
        accessTokenHash: hashToken(accessToken),
      })
      .save()

    return toTokens(grant, accessToken, options.refreshToken)
  }

  /**
   * Check an access token.
   *
   * @param accessToken
   *   Access token.
   * @returns
   *   Grant or error;
   *   `session_invalidated` when the person disconnected the service.
   */
  async verifyAccessToken(accessToken: string): Promise<Oauth2Error | Oauth2Grant> {
    const grant = await Oauth2Grant.findBy({ accessTokenHash: hashToken(accessToken) })

    if (!grant) return { error: 'invalid_token' }
    if (grant.revokedAt) return { error: 'session_invalidated' }
    if (
      !this.isAllowed(grant.did) ||
      !grant.accessTokenExpiresAt ||
      grant.accessTokenExpiresAt < DateTime.now()
    ) {
      return { error: 'invalid_token' }
    }

    return grant
  }

  /**
   * Revoke the grant of an access token, as a client does when a person
   * stops transfers there.
   *
   * @param accessToken
   *   Access token.
   * @returns
   *   Whether a grant was revoked.
   */
  async revoke(accessToken: string): Promise<boolean> {
    const grant = await Oauth2Grant.findBy({ accessTokenHash: hashToken(accessToken) })

    if (!grant || grant.revokedAt) return false

    await grant.merge({ revokedAt: DateTime.now() }).save()
    return true
  }

  /**
   * Check whether a person has connected services.
   *
   * @param did
   *   DID of the person.
   * @returns
   *   Whether any are connected.
   */
  async hasConnections(did: l.DidString): Promise<boolean> {
    const grant = await activeGrants(did).first()
    return grant !== null
  }

  /**
   * List the services a person connected.
   *
   * @param did
   *   DID of the person.
   * @returns
   *   Connections, one per client, oldest first.
   */
  async listConnections(did: l.DidString): Promise<Array<Oauth2Connection>> {
    const client = this.getClient()
    const grants = await activeGrants(did).orderBy('createdAt', 'asc')
    const connections = new Map<string, Oauth2Connection>()

    for (const grant of grants) {
      if (connections.has(grant.clientId)) continue
      connections.set(grant.clientId, {
        clientId: grant.clientId,
        createdAt: grant.createdAt.toISO(),
        name: client && client.id === grant.clientId ? client.name : grant.clientId,
      })
    }

    return [...connections.values()]
  }

  /**
   * Disconnect a service;
   * its tokens then get `session_invalidated`.
   *
   * @param did
   *   DID of the person.
   * @param clientId
   *   Client ID.
   * @returns
   *   Nothing.
   */
  async disconnect(did: l.DidString, clientId: string): Promise<undefined> {
    const grants = await Oauth2Grant.query()
      .where('did', did)
      .where('clientId', clientId)
      .whereNull('revokedAt')

    for (const grant of grants) {
      await grant.merge({ revokedAt: DateTime.now() }).save()
    }
  }
}

/**
 * Seconds that access tokens are valid.
 */
const accessTokenLifetime = 60 * 60

/**
 * Query grants that are in use: exchanged for tokens and not revoked.
 *
 * @param did
 *   DID of the person.
 * @returns
 *   Query.
 */
function activeGrants(did: l.DidString) {
  return Oauth2Grant.query()
    .where('did', did)
    .whereNull('revokedAt')
    .whereNotNull('refreshTokenHash')
}

/**
 * Seconds that codes are valid;
 * RFC 6749 recommends at most 10 minutes.
 */
const codeLifetime = 5 * 60

/**
 * Create a random token.
 *
 * @returns
 *   Token (256 bits, base64url).
 */
function createToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Hash a token, for storage;
 * tokens are random, so a fast hash is enough.
 *
 * @param token
 *   Token.
 * @returns
 *   Hash (base64url).
 */
export function hashToken(token: string): string {
  return hash(token).toString('base64url')
}

/**
 * Hash a value.
 *
 * @param value
 *   Value.
 * @returns
 *   SHA-256 digest.
 */
function hash(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}

/**
 * Turn a grant and its tokens into a token response.
 *
 * @param grant
 *   Grant.
 * @param accessToken
 *   Access token.
 * @param refreshToken
 *   Refresh token.
 * @returns
 *   Tokens.
 */
function toTokens(grant: Oauth2Grant, accessToken: string, refreshToken: string): Oauth2Tokens {
  return {
    access_token: accessToken,
    expires_in: accessTokenLifetime,
    refresh_token: refreshToken,
    scope: grant.scope,
    token_type: 'Bearer',
  }
}

export default new Oauth2Service()
