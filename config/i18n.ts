import app from '@adonisjs/core/services/app'
import { defineConfig, formatters, loaders } from '@adonisjs/i18n'
import { defaultLocale } from '#shared/locale'

const i18nConfig = defineConfig({
  defaultLocale,
  formatter: formatters.icu(),
  loaders: [
    /**
     * File system loader reads translations `resources/lang/$locale/`.
     */
    loaders.fs({ location: app.languageFilesPath() }),
  ],
})

export default i18nConfig
