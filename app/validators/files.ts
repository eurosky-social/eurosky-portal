import vine from '@vinejs/vine'
import { storageCategories } from '#shared/storage'

export const filesQueryValidator = vine.create({
  /**
   * Tab.
   */
  category: vine.enum(['all', ...storageCategories] as const).optional(),

  /**
   * Blobs to return.
   */
  limit: vine.number().max(100_000).min(1).optional(),

  /**
   * Snapshot anchor to pin the top of the list.
   */
  snapshot: vine.string().optional(),
})
