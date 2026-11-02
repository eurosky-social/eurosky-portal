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
    const { after, category, snapshot } = await request.validateUsing(filesQueryValidator)
    const result = await storageService.getStorage({ after, category, did, snapshot })

    if (result.state !== 'ready') {
      return inertia.render('files/show', { did, state: inertia.always(result.state) })
    }

    const props = {
      // Pages are appended on the client; tab switches reset them.
      blobs: inertia.merge(result.blobs).matchOn('cid'),
      breakdown: result.breakdown,
      category: inertia.always(result.category),
      did,
      next: inertia.always(result.next),
      pds: result.pds,
      snapshot: inertia.always(result.snapshot),
      state: inertia.always(result.state),
      total: inertia.always(result.total),
    }
    return inertia.render('files/show', props)
  }
}
