import vine from '@vinejs/vine'
import { supportedCollections } from '#utils/activity'

export const activityQueryValidator = vine.create({
  /**
   * Records to return.
   *
   * Activities per user are currently capped at 1k.
   */
  limit: vine.number().max(1000).min(1).optional(),

  /**
   * Snapshot anchor to pin the top of the list.
   */
  snapshot: vine.string().optional(),
})

export const activityDetailValidator = vine.create({
  params: vine.object({
    /**
     * Collection.
     */
    collection: vine.enum(supportedCollections),

    /**
     * Record key.
     */
    rkey: vine
      .string()
      .regex(/^[a-zA-Z0-9._:~-]{1,512}$/)
      .notIn(['.', '..']),
  }),
})
