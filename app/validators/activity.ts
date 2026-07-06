import vine from '@vinejs/vine'

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
