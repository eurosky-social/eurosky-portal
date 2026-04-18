import { Exception } from '@adonisjs/core/exceptions'
import type { l } from '@atproto/lex'
import vine from '@vinejs/vine'

export class SlingshotResolveError extends Exception {
  static code = 'E_SLINGSHOT_RESOLVE_ERROR'
  static status = 500
  static message = 'Unable to resolve identity with slingshot'
}

const resolveMiniDocValidator = vine.create({
  did: vine.atproto.did(),
  handle: vine.atproto.handle(),
})

export class SlingshotService {
  private baseUrl = 'https://slingshot.microcosm.blue'
  protected fetcher: typeof fetch

  constructor(fetcher?: typeof fetch) {
    this.fetcher = fetcher ?? fetch
  }

  async resolveMiniDoc(
    actor: l.AtIdentifierString,
    abortSignal?: AbortSignal
  ): Promise<{ did: l.DidString; handle: l.HandleString } | undefined> {
    const url = new URL('/xrpc/blue.microcosm.identity.resolveMiniDoc', this.baseUrl)
    url.searchParams.set('identifier', actor)

    try {
      const res = await this.fetcher(url, { signal: abortSignal })
      const json = await res.json()

      if (!res.ok) {
        return undefined
      }

      const [error, result] = await resolveMiniDocValidator.tryValidate(json)
      if (error) {
        console.log(error)
        throw new SlingshotResolveError()
      }

      return {
        did: result.did,
        handle: result.handle,
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }

      if (error instanceof SlingshotResolveError) {
        throw error
      }

      throw new SlingshotResolveError(SlingshotResolveError.message, { cause: error })
    }
  }
}
