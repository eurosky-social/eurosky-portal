import vine from '@vinejs/vine'

export const appValidator = vine.create({
  params: vine.object({
    /**
     * Record key of the app listing.
     */
    rkey: vine.string(),
  }),
})
