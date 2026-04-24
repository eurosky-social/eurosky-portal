import vine from '@vinejs/vine'
import { getHandleDomain } from '#utils/oauth'

const handleDomain = getHandleDomain()

export const loginRequestValidator = vine.create({
  input: vine.unionOfTypes([
    vine.atproto.did(),
    vine.atproto.service(),
    // We allow login with username, @username, @username.eurosky.social, username@eurosky.social or
    // @username@eurosky.social. These aren't standard handle formats, but what
    // we've seen entered during user testing.
    vine.atproto.handle().parse((value) => {
      if (typeof value === 'string') {
        let newValue = value

        if (value.includes(':')) {
          return value
        }

        // Append handle domain if only a username was entered:
        if (!value.includes('.') && handleDomain) {
          value += handleDomain
        }

        // Remove leading @ signs
        if (value.startsWith('@')) {
          newValue = value.slice(1)
        }

        // Remove @ signs separating username from handle domain component:
        // e.g., username@eurosky.social, but only if it's the handle domain
        // so username@gmail.com won't be converted to username.gmail.com
        if (handleDomain && newValue.includes('@') && newValue.endsWith(handleDomain)) {
          newValue = newValue.replace('@', '.')
        }

        return newValue
      }
      return value
    }),
    vine.atproto.handleUsername(),
  ]),
})

export const signupRequestValidator = vine.create({
  terms: vine.accepted(),
})
