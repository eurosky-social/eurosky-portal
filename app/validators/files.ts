import vine from '@vinejs/vine'
import { storageCategories } from '#shared/storage'

export const filesQueryValidator = vine.create({
  /**
   * Cursor of the previous page.
   */
  after: vine.string().maxLength(512).optional(),

  /**
   * Tab.
   */
  category: vine.enum(['all', ...storageCategories] as const).optional(),

  /**
   * Snapshot anchor to pin the top of the list.
   */
  snapshot: vine.string().maxLength(512).optional(),
})
