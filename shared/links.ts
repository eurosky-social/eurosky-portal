import type { Locale } from '#shared/locale'

/**
 * External pages that the portal links to.
 */
export const links = {
  about(locale: Locale) {
    return localize('https://eurosky.tech/about/', locale)
  },
  contact(locale: Locale) {
    return localize('https://eurosky.tech/contact/', locale)
  },
  feedback(_locale: Locale) {
    return 'https://userinput.app/#/s/did:plc:ooensn4mr5mhznzypvxelfa3/3mr5gmbhteg2p'
  },
  help(locale: Locale) {
    return localize('https://eurosky.tech/help/', locale)
  },
  helpCantMigrate(locale: Locale) {
    return localize('https://eurosky.tech/help/created-account-cant-migrate/', locale)
  },
  helpInvalidHandle(locale: Locale) {
    return localize('https://eurosky.tech/help/handle-invalid/', locale)
  },
  helpPasswordReset(locale: Locale) {
    return localize('https://eurosky.tech/help/password-reset/', locale)
  },
  linkedin(_locale: Locale) {
    return 'https://www.linkedin.com/company/euroskysocial'
  },
  mu(_locale: Locale) {
    return 'https://mu.social/profile/eurosky.social'
  },
  privacy(_locale: Locale) {
    return 'https://eurosky.tech/accounts/privacy/'
  },
  security(_locale: Locale) {
    return 'https://eurosky.tech/security/'
  },
  status(_locale: Locale) {
    return 'https://eurosky-social.hyperping.app/'
  },
  terms(_locale: Locale) {
    return 'https://eurosky.tech/accounts/terms/'
  },
  transparency(_locale: Locale) {
    return 'https://eurosky.tech/transparency/'
  },
}

/**
 * Get the URL of the migration service (`MIGRATION_SERVICE`) in a locale;
 * `move.eurosky.tech` takes it as `?locale=de` (and falls back to English).
 *
 * @param url
 *   URL of the migration service.
 * @param locale
 *   Locale.
 * @returns
 *   Localized URL.
 */
export function localizeMigration(url: string, locale: Locale): string {
  const result = new URL(url)
  result.searchParams.set('locale', locale)
  return result.href
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
