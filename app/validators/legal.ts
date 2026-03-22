import vine from '@vinejs/vine'

export const legalValidator = vine.create({
  params: vine.object({
    document: vine.enum(['terms', 'privacy']),
  }),
})

export const termsRequestValidator = vine.create({
  terms: vine.accepted(),
})
