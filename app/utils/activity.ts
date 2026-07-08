import { DateTime } from 'luxon'
import type { NsidString } from '@atproto/lex'
import * as lexicon from '#lexicons'

/**
 * Typed supported records.
 */
export type Activity =
  | lexicon.app.bsky.feed.like.Main
  | lexicon.app.bsky.feed.post.Main
  | lexicon.app.bsky.graph.follow.Main
  | lexicon.id.sifa.profile.language.Main
  | lexicon.site.standard.document.Main

/**
 * Preview of a record.
 */
interface Preview {
  /**
   * Valid date.
   */
  createdAt: DateTime<true> | undefined

  /**
   * Preview text.
   */
  text: string | undefined
}

/**
 * Supported collection.
 */
export type SupportedCollection = (typeof supportedCollections)[number]

/**
 * @param value
 *   Value.
 * @returns
 *   Whether `value` is a known collection.
 */
export function isSupportedCollection(value: unknown): value is SupportedCollection {
  const list = supportedCollections as ReadonlyArray<unknown>
  return list.includes(value)
}

/**
 * Supported collections.
 */
export const supportedCollections = [
  'app.bsky.feed.like',
  'app.bsky.feed.post',
  'app.bsky.graph.follow',
  'id.sifa.profile.language',
  'site.standard.document',
] as const satisfies ReadonlyArray<NsidString>

/**
 * @param value
 *   Value.
 * @returns
 *   Date if valid.
 */
function toDate(value: string): DateTime<true> | undefined {
  const date = DateTime.fromISO(value)
  return date.isValid ? date : undefined
}

/**
 * Normalize fields.
 *
 * Note: when you update this function (and push the changes),
 * it is important to run the `portal:resync-collection` commands
 * so that already-indexed rows pick up the changes.
 * Something like:
 *
 * ```sh
 * node ace portal:resync-collection id.sifa.profile.language
 * ```
 *
 * @param value
 *   Value.
 * @returns
 *   Preview.
 * @throws
 *   For unknown collections.
 */
export function toPreview(value: Activity): Preview {
  // Again, when changing these, run `node ace portal:resync-collection`!
  const $type = value.$type
  switch ($type) {
    case 'app.bsky.feed.like':
      return { createdAt: toDate(value.createdAt), text: undefined }
    case 'app.bsky.feed.post':
      return { createdAt: toDate(value.createdAt), text: value.text }
    case 'app.bsky.graph.follow':
      return { createdAt: toDate(value.createdAt), text: undefined }
    case 'id.sifa.profile.language':
      return { createdAt: toDate(value.createdAt), text: value.name }
    case 'site.standard.document':
      return { createdAt: toDate(value.publishedAt), text: value.title }
    default:
      throw new Error(`Unsupported collection: ${$type}`)
  }
}

/**
 * Validate a raw record against its own lexicon.
 *
 * @param collection
 *   NSID.
 * @param value
 *   Raw record value.
 * @returns
 *   Typed record or `undefined` for unknown collections.
 */
export function toValue(collection: NsidString, value: unknown): Activity | undefined {
  switch (collection) {
    case 'app.bsky.feed.like':
      return lexicon.app.bsky.feed.like.$ifMatches(value)
    case 'app.bsky.feed.post':
      return lexicon.app.bsky.feed.post.$ifMatches(value)
    case 'app.bsky.graph.follow':
      return lexicon.app.bsky.graph.follow.$ifMatches(value)
    case 'id.sifa.profile.language':
      return lexicon.id.sifa.profile.language.$ifMatches(value)
    case 'site.standard.document':
      return lexicon.site.standard.document.$ifMatches(value)
    default:
      return
  }
}
