import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

async function sleep(duration: number) {
  const { promise, resolve } = Promise.withResolvers()
  setTimeout(() => {
    resolve(undefined)
  }, duration)
  return promise
}

export default class PortalBackfillHandles extends BaseCommand {
  static commandName = 'portal:backfill-handles'
  static description = 'Tool to backfill handles on the Account model'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { default: Account } = await import('#models/account')
    const { SlingshotService } = await import('#services/slingshot_service')
    const slingshot = new SlingshotService()

    let page = 0
    let hasMore = true
    while (hasMore) {
      const result = await Account.query()
        .whereNull('handle')
        .paginate(page + 1, 100)

      if (result.total === 0) {
        this.logger.info('Nothing to do!')
        return
      }

      this.logger.info(
        `Processing page ${result.currentPage} of ${Math.ceil(result.total / result.perPage)}, total: ${result.total}`
      )

      hasMore = result.hasMorePages

      await Promise.all(
        result.all().map(async (account) => {
          const resolved = await slingshot.resolveMiniDoc(account.did).catch((error) => {
            this.logger.error(`Unable to resolve handle for ${account.did}: ${error}`)
            return undefined
          })

          if (!resolved) {
            this.logger.info(`Unable to resolve handle for ${account.did}`)
            return
          }

          await Account.updateOrCreate(
            { did: account.did },
            { did: account.did, handle: resolved.handle }
          )
        })
      )

      await sleep(1000)
    }
  }
}
