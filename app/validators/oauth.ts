import vine from '@vinejs/vine'
import { getHandleDomains } from '#utils/oauth'

const handleDomains = getHandleDomains()
const handleDomain = handleDomains.at(0)

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

        // Remove leading @ signs
        if (newValue.startsWith('@')) {
          newValue = newValue.slice(1)
        }

        // Append handle domain if only a username was entered:
        if (!newValue.includes('.') && !newValue.includes('@') && handleDomain) {
          newValue += handleDomain
        }

        // Remove @ signs separating username from handle domain component:
        // e.g., username@eurosky.social, but only if it's a handle domain
        // so username@gmail.com won't be converted to username.gmail.com
        // (domains start with a dot, so `.eurosky.social` > `@eurosky.social`).
        const atDomain = handleDomains.find((domain) =>
          newValue.toLowerCase().endsWith('@' + domain.slice(1))
        )
        if (atDomain) {
          newValue = newValue.slice(0, -atDomain.length) + atDomain
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
