import vine from '@vinejs/vine'

export const loginRequestValidator = vine.create({
  input: vine.unionOfTypes([
    // We allow login with @username.eurosky.social, username@eurosky.social or
    // @username@eurosky.social. These aren't standard handle formats, but what
    // we've seen entered during user testing.
    vine.atproto.handle().parse((value) => {
      if (typeof value === 'string') {
        let newValue = value
        if (value.startsWith('@')) {
          newValue = value.slice(1)
        }
        if (newValue.includes('@')) {
          newValue = newValue.replace('@', '.')
        }
        return newValue
      }
      return value
    }),
    vine.atproto.did(),
    vine.atproto.service(),
    vine.atproto.handleUsername(),
  ]),
})

export const signupRequestValidator = vine.create({
  terms: vine.accepted(),
})
