import vine from '@vinejs/vine'

export const connectionValidator = vine.create({
  params: vine.object({
    /**
     * Client ID of the connected service.
     */
    clientId: vine.string(),
  }),
})
