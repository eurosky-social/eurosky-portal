import vine, { VineString } from '@vinejs/vine'
import logger from '@adonisjs/core/services/logger'
import app from '@adonisjs/core/services/app'
import { access, constants } from 'node:fs/promises'
import { relative } from 'node:path'

const fileExists = vine.createRule(
  async (value, _options, field) => {
    if (!field.isValid || typeof value !== 'string') return false

    if (app.inDev) {
      try {
        await access(value, constants.R_OK)
        return true
      } catch (err) {
        const path = relative(field.meta.menuFileRoot, value)
        logger.error({ path, parent: field.data }, `Missing file: ${path}`)
      }
      return false
    }

    return true
  },
  { isAsync: true }
)

declare module '@vinejs/vine' {
  interface VineString {
    fileExists(): this
  }
}
VineString.macro('fileExists', function (this: VineString) {
  return this.use(fileExists())
})
