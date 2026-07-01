import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { isNsidString } from '@atproto/lex'

async function sleep(duration: number) {
  const { promise, resolve } = Promise.withResolvers()
  setTimeout(() => {
    resolve(undefined)
  }, duration)
  return promise
}

/**
 * Backfills a collection again for every known account.
 * Use this when changing `normalizeActivityRecord` (in `app/utils/activity_records.ts`).
 */
export default class PortalResyncCollection extends BaseCommand {
  static commandName = 'portal:resync-collection'
  static description = 'Tool that backfills a collection to refresh derived activity fields'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Collection NSID to resync (example: `app.bsky.feed.post`)' })
  declare collection: string

  async run() {
    const { default: Account } = await import('#models/account')
    const { default: activityService } = await import('#services/activity_service')
    const { collection } = this

    if (!isNsidString(collection)) {
      this.logger.error(`Not a valid NSID: \`${collection}\``)
      this.exitCode = 1
      return
    }

    let page = 0
    let more = true
    let done = 0

    while (more) {
      const result = await Account.query()
        .orderBy('did')
        .paginate(page + 1, 50)

      if (result.total === 0) {
        this.logger.info('Nothing to do!')
        return
      }

      more = result.hasMorePages
      page++

      await Promise.all(
        result.all().map(async (account) => {
          const { did } = account
          try {
            await activityService.backfillCollection(did, collection)
          } catch (error) {
            this.logger.error(`Failed for ${did}: ${error}`)
          } finally {
            done++
          }
        })
      )

      this.logger.info(`Processed ${done}/${result.total}`)
      await sleep(1000)
    }

    this.logger.success(`Done resyncing \`${collection}\``)
  }
}
