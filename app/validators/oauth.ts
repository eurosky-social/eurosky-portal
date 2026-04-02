import vine from '@vinejs/vine'

export const loginRequestValidator = vine.create({
  input: vine.unionOfTypes([
    vine.atproto.handle(),
    vine.atproto.did(),
    vine.atproto.service(),
    vine.atproto.handleUsername(),
  ]),
})

export const signupRequestValidator = vine.create({
  terms: vine.accepted(),
})
