import { DateTime } from 'luxon'
import type { NsidString } from '@atproto/lex'
import * as lexicon from '#lexicons'

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

const dateFields = ['createdAt', 'publishedAt']
const textFields = ['text', 'title']

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
 * @param collection
 *   NSID.
 * @param value
 *   Raw record value.
 * @returns
 *   Normalized fields, for known and unknown collections.
 *   Returns `undefined` for known but invalid records.
 */
export function normalizeActivityRecord(
  collection: NsidString,
  value: unknown
): Result | undefined {
  // Again, when changing these, run `node ace portal:resync-collection`!
  switch (collection) {
    case 'app.bsky.feed.like': {
      if (!lexicon.app.bsky.feed.like.$matches(value)) return
      return { createdAt: toDate(value.createdAt), text: undefined }
    }
    case 'app.bsky.feed.post': {
      if (!lexicon.app.bsky.feed.post.$matches(value)) return
      return { createdAt: toDate(value.createdAt), text: value.text }
    }
    case 'app.bsky.graph.follow': {
      if (!lexicon.app.bsky.graph.follow.$matches(value)) return
      return { createdAt: toDate(value.createdAt), text: undefined }
    }
    case 'id.sifa.profile.language': {
      if (!lexicon.id.sifa.profile.language.$matches(value)) return
      return { createdAt: toDate(value.createdAt), text: value.name }
    }
    case 'site.standard.document': {
      if (!lexicon.site.standard.document.$matches(value)) return
      return { createdAt: toDate(value.publishedAt), text: value.title }
    }
    default: {
      if (typeof value !== 'object' || value === null) return
      const fields = value as Record<string, unknown>

      let createdAt: DateTime<true> | undefined
      for (const field of dateFields) {
        if (field in fields) {
          const raw = fields[field]
          const date = typeof raw === 'string' ? toDate(raw) : undefined
          createdAt = date
          break
        }
      }

      let text: string | undefined
      for (const field of textFields) {
        if (field in fields) {
          const raw = fields[field]
          text = typeof raw === 'string' ? raw : undefined
          break
        }
      }

      return { createdAt, text }
    }
  }
}

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
