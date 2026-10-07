import { configProvider } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'
import { defineConfig, formatters, loaders } from '@adonisjs/i18n'
import type { FormatterFactory } from '@adonisjs/i18n/types'
import { brand } from '#shared/brand'
import { defaultLocale } from '#shared/locale'

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
     * File system loader reads translations `resources/lang/$locale/`.
     */
    loaders.fs({ location: app.languageFilesPath() }),
  ],
})

export default i18nConfig
