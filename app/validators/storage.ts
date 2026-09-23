import vine from '@vinejs/vine'
import { storageCategories } from '#shared/storage'

export const storageQueryValidator = vine.create({
  /**
   * Category (file browser tab) to return a page of blobs for.
   */
  category: vine.enum(storageCategories).optional(),

  /**
   * Blobs to return.
   */
  limit: vine.number().max(100_000).min(1).optional(),

  /**
   * Snapshot anchor to pin the top of the list.
   */
  snapshot: vine.string().optional(),
})
