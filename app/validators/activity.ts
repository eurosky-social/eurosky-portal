import vine from '@vinejs/vine'

export const activityQueryValidator = vine.create({
  /**
   * Records to return.
   *
   * Takes a while to click “load more” until 5k items.
   * But the database should handle it very well.
   * So no reason to limit it to conceivable, lower numbers.
   */
  limit: vine.number().max(5000).min(1).optional(),

  /**
   * Snapshot anchor to pin the top of the list.
   */
  snapshot: vine.string().optional(),
})
