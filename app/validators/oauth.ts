import vine from '@vinejs/vine'

export const loginRequestValidator = vine.create({
  input: vine.unionOfTypes([
    // We allow login with username, @username, @username.eurosky.social, username@eurosky.social or
    // @username@eurosky.social. These aren't standard handle formats, but what
    // we've seen entered during user testing.
    vine.atproto.handle().parse((value, ctx) => {
      if (typeof value === 'string') {
        let newValue = value

        // Append handle domain if only a username was entered:
        if (!value.includes('.')) {
          value += ctx.meta.handleDomain
        }

        // Remove leading @ signs
        if (value.startsWith('@')) {
          newValue = value.slice(1)
        }

        // Remove @ signs separating username from handle domain component:
        // e.g., username@eurosky.social
        if (ctx.meta.handleDomain) {
          if (newValue.includes('@') && newValue.endsWith(ctx.meta.handleDomain)) {
            newValue = newValue.replace('@', '.')
          }
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
