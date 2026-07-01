import { DateTime } from 'luxon'
import type { NsidString } from '@atproto/lex'

export interface Result {
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
 * Normalize fields.
 *
 * @param collection
 *   NSID.
 * @param value
 *   Raw record value.
 * @returns
 *   Normalized fields.
 */
export function normalizeActivityRecord(
  collection: NsidString,
  value: Record<string, unknown> | null | undefined
): Result {
  const createdAtRaw = value?.createdAt
  const createdAt = typeof createdAtRaw === 'string' ? DateTime.fromISO(createdAtRaw) : undefined
  const text = value ? toText(collection, value) : undefined
  return { createdAt: createdAt?.isValid ? createdAt : undefined, text }
}

/**
 * Note: when you update this function (and push the changes),
 * it is important to run the `portal:resync-collection` commands
 * so that already-indexed rows pick up the changes.
 * Something like:
 *
 * ```sh
 * node ace portal:resync-collection id.sifa.profile.language
 * ```
 *
 * @param collection
 *   NSID.
 * @param value
 *   Raw record value.
 * @returns
 *   Preview text.
 */
function toText(collection: NsidString, value: Record<string, unknown>): string | undefined {
  switch (collection) {
    // Again, when changing these, run `node ace portal:resync-collection`!
    case 'app.bsky.feed.post':
      const text = value.text
      return typeof text === 'string' ? text : undefined
    case 'id.sifa.profile.language':
      const name = value.name
      return typeof name === 'string' ? name : undefined
    default:
      return
  }
}
