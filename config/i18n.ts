import { configProvider } from '@adonisjs/core'
import { defineConfig, formatters } from '@adonisjs/i18n'
import type { FormatterFactory, LoaderFactory, Translations } from '@adonisjs/i18n/types'
import { brand } from '#shared/brand'
import { defaultLocale, locales } from '#shared/locale'

const i18nConfig = defineConfig({
  defaultLocale,
  /**
   * ICU formatter that always passes `brand` (`{orgName}`, `{productTitle}`).
   */
  formatter: configProvider.create<FormatterFactory>(async (resolverApp) => {
    const icu = await formatters.icu().resolver(resolverApp)
    return function (config) {
      const formatter = icu(config)
      return {
        name: formatter.name,
        format(message, locale, data) {
          return formatter.format(message, locale, { ...brand, ...data })
        },
      }
    }
  }),
  loaders: [
    /**
     * Load the catalogs shared with the client (`shared/i18n/$locale.ts`).
     */
    function (): ReturnType<LoaderFactory> {
      return {
        async load() {
          const translations: Translations = {}

          for (const locale of locales) {
            const module: { default: Record<string, string> } = await import(
              `#shared/i18n/${locale}`
            )
            translations[locale] = module.default
          }

          return translations
        },
      }
    },
  ],
})

export default i18nConfig
