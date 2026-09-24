import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Recomputes every blob’s stored `category` from its already-known MIME
 * type (no network access needed).
 * Use this after changing media types in `#shared/mime`.
 */
export default class StorageRecategorize extends BaseCommand {
  static commandName = 'storage:recategorize'
  static description = 'Recompute every blob’s stored `category` from its MIME type'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { default: Blob } = await import('#models/blob')
    const { mediaType, normalizeMimeType } = await import('#shared/mime')

    const pageSize = 500
    let page = 0
    let more = true
    let seen = 0
    let changed = 0

    while (more) {
      const result = await Blob.query()
        .orderBy('id')
        .paginate(page + 1, pageSize)
      more = result.hasMorePages
      page++

      const updates: Array<Promise<unknown>> = []

      for (const blob of result.all()) {
        seen++
        const category = mediaType(normalizeMimeType(blob.mimeType))
        if (category !== blob.category) {
          blob.category = category
          changed++
          updates.push(blob.save())
        }
      }

      await Promise.all(updates)

      this.logger.info(`Checked ${seen}, updated ${changed}`)
    }

    this.logger.success(`Done: updated ${changed}/${seen} blobs`)
  }
}
