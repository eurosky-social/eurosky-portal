import { type BlobRef, type DidString, getBlobCidString } from '@atproto/lex'

export interface Context {
  did: DidString
  pds: string
}

export type BlobLocator = {
  cid: string
  did: DidString
  pds: string
}

/**
 * Turn a lexicon blob ref into a locator that can be resolved into a URL.
 *
 * @param blob
 *   Blob ref.
 * @param context
 *   DID + PDS.
 * @returns
 *   Blob locator.
 */
export function toBlobLocator(blob: BlobRef, context: Context): BlobLocator {
  return { cid: getBlobCidString(blob), did: context.did, pds: context.pds }
}
