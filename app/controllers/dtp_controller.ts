import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import type { DidString } from '@atproto/lex'
import { TokenInvalidError, TokenRefreshError, TokenRevokedError } from '@atproto/oauth-client-node'
import {
  isMultipartRequest,
  MaxFileSizeExceededError,
  MaxTotalSizeExceededError,
  MultipartParseError,
  type MultipartPart,
  parseMultipartRequest,
} from '@remix-run/multipart-parser/node'
import type { Infer } from '@vinejs/vine/types'
import { DateTime } from 'luxon'
import importService from '#services/import_service'
import oauth2Service from '#services/oauth2_service'
import { normalizeMimeType } from '#shared/mime'
import { ImageError, isImageType } from '#utils/image'
import { getBearerToken } from '#utils/oauth'
import { captureException, captureMessage } from '#utils/telemetry'
import { dtpMediaValidator } from '#validators/dtp'

/**
 * Error as DTP reads it (`ErrorResponse.java` there).
 */
interface DtpError {
  /**
   * Code;
   * `invalid_token` makes the client refresh its token and retry,
   * `session_invalidated` stops its transfers,
   * `destination_full` pauses them,
   * others skip the item.
   */
  error:
    | 'destination_full'
    | 'invalid_request'
    | 'invalid_token'
    | 'server_error'
    | 'session_invalidated'
    | 'temporarily_unavailable'

  /**
   * Description, if any.
   */
  error_description?: string
}

/**
 * Parts of a multipart request: metadata (JSON) and a file.
 */
type Parts = [metadata: MultipartPart, file: MultipartPart]

/**
 * Item read from a request: metadata and, for photos and videos, a file.
 */
interface Item {
  file: MultipartPart | undefined
  metadata: Infer<typeof dtpMediaValidator>
}

/**
 * Exception that answers with a DTP error.
 */
class DtpException extends Exception {
  /**
   * Error.
   */
  body: DtpError

  /**
   * @param status
   *   HTTP status.
   * @param body
   *   Error.
   */
  constructor(status: number, body: DtpError) {
    super(body.error_description ?? body.error, { code: body.error, status })
    this.body = body
  }

  /**
   * Answer with the error.
   */
  async handle(error: this, { response }: HttpContext): Promise<undefined> {
    response.status(error.status).send(error.body)
  }

  /**
   * Expected, so not reported.
   */
  async report(): Promise<undefined> {}
}

/**
 * Endpoints for the generic importer of DTP (`GenericFileImporter.java` there),
 * which connected services (see `Oauth2Controller`) call:
 * one item per request, one at a time, with an access token.
 */
export default class DtpController {
  /**
   * Import an album, photo, or video.
   *
   * Albums are JSON;
   * photos and videos are `multipart/related`: JSON, then the file.
   */
  async media({ request, response }: HttpContext): Promise<undefined> {
    const did = await authenticate(request.header('authorization'))
    const { file, metadata } = await readItem(request)
    const { payload } = metadata

    // To do: albums as threads or galleries.
    if (payload['@type'] === 'Album') {
      response.ok({})
      return
    }

    // To do: videos.
    if (payload['@type'] === 'Video') throw invalidRequest('Videos are not supported yet')

    const mimeType = normalizeMimeType(file?.mediaType)

    if (!file || !isImageType(mimeType)) throw invalidRequest('Expected an image')

    try {
      await importService.importPhoto(did, {
        data: file.bytes,
        description: payload.description,
        mimeType,
        uploadedTime: parseTime(payload.uploadedTime),
      })
    } catch (error) {
      if (error instanceof ImageError) throw invalidRequest(error.message)

      // Stop transfers if the session ended as nothing can be imported until
      // the person logs in again.
      // Check causes as clients wrap errors of sessions.
      let cause = error

      while (cause instanceof Error) {
        if (
          cause instanceof TokenInvalidError ||
          cause instanceof TokenRefreshError ||
          cause instanceof TokenRevokedError
        ) {
          throw new DtpException(401, {
            error: 'session_invalidated',
            error_description: 'Session on the PDS ended',
          })
        }

        cause = cause.cause
      }

      logger.error({ err: error }, 'dtp: cannot import photo')
      captureException(error, { tags: { component: 'dtp' } })
      throw new DtpException(500, { error: 'server_error' })
    }

    response.created({})
  }
}

/**
 * Get the DID of the person who connected the client, from a bearer token.
 *
 * @param authorization
 *   `authorization` header.
 * @returns
 *   DID.
 * @throws
 *   When the token is missing or not valid.
 */
async function authenticate(authorization: string | undefined): Promise<DidString> {
  const token = getBearerToken(authorization)
  const grant = token ? await oauth2Service.verifyAccessToken(token) : undefined

  if (!grant) throw new DtpException(401, { error: 'invalid_token' })
  if ('error' in grant) {
    const error = grant.error === 'session_invalidated' ? grant.error : 'invalid_token'
    throw new DtpException(401, { error })
  }

  return grant.did
}

/**
 * Exception for a request that cannot be handled.
 *
 * @param description
 *   Description.
 * @returns
 *   Exception.
 */
function invalidRequest(description: string): DtpException {
  return new DtpException(400, { error: 'invalid_request', error_description: description })
}

/**
 * Parse when something was uploaded.
 *
 * @param value
 *   Date (ISO 8601)
 * @returns
 *   Date if valid or now.
 */
function parseTime(value: string | null | undefined): DateTime<true> {
  const time = value ? DateTime.fromISO(value) : undefined
  return time?.isValid ? time : DateTime.now()
}
/**
 * Read an item from a request: its validated metadata and its file.
 *
 * @param request
 *   Request.
 * @returns
 *   Item.
 * @throws
 *   When the request cannot be read or is not valid.
 */
async function readItem(request: HttpContext['request']): Promise<Item> {
  let file: MultipartPart | undefined
  let data: unknown

  // Albums are JSON only, which the body parser already read.
  if (request.is(['json'])) {
    data = request.body()
  } else {
    const [metadataPart, filePart] = await readParts(request)

    try {
      data = JSON.parse(metadataPart.text)
    } catch {}

    file = filePart
  }

  const [error, metadata] = await dtpMediaValidator.tryValidate(data)

  if (error) throw invalidRequest('Invalid metadata')

  // Currently at `0.1.x`.
  if (!/^0\.1\.\d+$/.test(metadata.apiVersion)) {
    logger.warn({ apiVersion: metadata.apiVersion }, 'dtp: unsupported `apiVersion`')
    captureMessage('Unsupported DTP `apiVersion`', {
      extra: { apiVersion: metadata.apiVersion },
      level: 'warning',
      tags: { component: 'dtp' },
    })
    throw invalidRequest('Unsupported `apiVersion`')
  }

  return { file, metadata }
}

/**
 * Read the parts of a multipart request.
 *
 * @param request
 *   Request.
 * @returns
 *   Parts.
 * @throws
 *   When not multipart, too large, invalid, or not two parts.
 */
async function readParts(request: HttpContext['request']): Promise<Parts> {
  if (!isMultipartRequest(request.request)) {
    throw invalidRequest('Expected JSON or `multipart/related`')
  }

  const parts: Array<MultipartPart> = []
  // Max size of the whole item in bytes.
  const maxFileSize = 20_000_000 // 20mb.

  try {
    for await (const part of parseMultipartRequest(request.request, {
      maxFileSize,
      maxParts: 2,
      maxTotalSize: maxFileSize * 1.1,
    })) {
      parts.push(part)
    }
  } catch (error) {
    if (error instanceof MaxFileSizeExceededError || error instanceof MaxTotalSizeExceededError) {
      throw new DtpException(413, {
        error: 'invalid_request',
        error_description: 'Body is too large',
      })
    }

    if (error instanceof MultipartParseError) throw invalidRequest(error.message)

    throw error
  }

  // `maxParts` above stops at two.
  const [metadata, file] = parts
  if (!metadata || !file) throw invalidRequest('Expected metadata and a file')
  return [metadata, file]
}
