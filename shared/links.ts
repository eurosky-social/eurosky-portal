import type { Locale } from '#shared/locale'

/**
 * External pages that the portal links to.
 */
export const links = {
  contact(locale: Locale) {
    return localize('https://eurosky.tech/contact/', locale)
  },
  feedback(_locale: Locale) {
    return 'https://userinput.app/#/s/did:plc:ooensn4mr5mhznzypvxelfa3/3mr5gmbhteg2p'
  },
  help(locale: Locale) {
    return localize('https://eurosky.tech/help/', locale)
  },
  helpInvalidHandle(locale: Locale) {
    return localize('https://eurosky.tech/help/handle-invalid/', locale)
  },
  privacy(_locale: Locale) {
    return 'https://eurosky.tech/accounts/privacy/'
  },
  terms(_locale: Locale) {
    return 'https://eurosky.tech/accounts/terms/'
  },
}

/**
 * `eurosky.tech` uses e.g., `/this` to `/de/this`.
 *
 * @param url
 *   URL.
 * @param locale
 *   Locale.
 * @returns
 *   Localized URL.
 */
function localize(url: string, locale: Locale): string {
  // Locales that `eurosky.tech` has locale pages in.
  // English uses the default, so not included here.
  if (locale === 'de' || locale === 'fr' || locale === 'nl') {
    const result = new URL(url)
    result.pathname = '/' + locale + result.pathname
    return result.href
  }

  return url
}
