import { ListLoader } from '@adonisjs/core/ace'
import PortalBackfillHandles from '#commands/portal_backfill_handles'
import PortalResyncCollection from '#commands/portal_resync_collection'
import StorageRecategorize from '#commands/storage_recategorize'

/**
 * Commands of this app.
 *
 * Listed, not scanned from a folder, as Ace then imports `.js` files,
 * which only exist when built.
 */
const loader = new ListLoader([PortalBackfillHandles, PortalResyncCollection, StorageRecategorize])

export const getCommand = loader.getCommand.bind(loader)
export const getMetaData = loader.getMetaData.bind(loader)
