import type { HttpContext } from '@adonisjs/core/http'
import storageService from '#services/storage_service'
import { filesQueryValidator } from '#validators/files'

/**
 * Get needed data and show the files page.
 */
export default class FilesController {
  /**
   * Gets a page of a user’s blobs (for one category) and a breakdown of
   * their storage use, and renders the files page.
   */
  async show({ auth, inertia, request }: HttpContext) {
    const { did } = auth.getUserOrFail()
    const { category, limit, snapshot } = await request.validateUsing(filesQueryValidator)
    const result = await storageService.getStorage({ category, did, limit, snapshot })

    if (result.state === 'syncing') {
      return inertia.render('files/show', { did, state: inertia.always(result.state) })
    }

    const props = {
      blobs: result.blobs,
      breakdown: result.breakdown,
      category: inertia.always(result.category),
      did,
      hasMore: inertia.always(result.hasMore),
      // `undefined` is dropped by `JSON.stringify` so use `null`.
      snapshot: inertia.always(result.snapshot ?? null),
      state: inertia.always(result.state),
      total: inertia.always(result.total),
    }
    return inertia.render('files/show', props)
  }
}
