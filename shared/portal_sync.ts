export type {
  Blob as ListBlobDetailsBlob,
  $OutputBody as ListBlobDetailsOutputBody,
  $Params as ListBlobDetailsParams,
} from '../app/lexicons/social/eurosky/portal/sync/listBlobDetails.defs.js'

export type {
  Category as StorageBreakdownCategory,
  $OutputBody as StorageBreakdownOutputBody,
  $Params as StorageBreakdownParams,
} from '../app/lexicons/social/eurosky/portal/sync/getStorageBreakdown.defs.js'

/**
 * NSIDs for XRPC methods.
 */
export const portalSyncNsid = {
  /**
   * Get a breakdown of storage use.
   */
  getStorageBreakdown: 'social.eurosky.portal.sync.getStorageBreakdown',

  /**
   * List blob metadata details for a given DID.
   */
  listBlobDetails: 'social.eurosky.portal.sync.listBlobDetails',
} as const

/**
 * Paths for XRPC methods.
 */
export const portalSyncPath = {
  /**
   * Get a breakdown of storage use.
   */
  getStorageBreakdown: `/xrpc/${portalSyncNsid.getStorageBreakdown}`,

  /**
   * List blob metadata details for a given DID.
   */
  listBlobDetails: `/xrpc/${portalSyncNsid.listBlobDetails}`,
} as const
