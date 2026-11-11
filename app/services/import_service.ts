import { createHash } from 'node:crypto'
import { create as createTid } from '@atcute/tid'
import { type DidString, getBlobCidString } from '@atproto/lex'
import { toDatetimeString } from '@atproto/syntax'
import type { DateTime } from 'luxon'
import * as lexicon from '#lexicons/index'
import { fitImage, type ImageType } from '#utils/image'
import { pdsSessionClient } from '#utils/pds'
import { truncate } from '#utils/text'

/**
 * Max size of an image, in bytes (`app.bsky.embed.images`).
 */
const maxImageSize = 2_000_000

/**
 * Image types Bluesky shows in posts;
 * others are converted to JPEG.
 */
const imageTypes: ReadonlyArray<ImageType> = ['image/gif', 'image/jpeg', 'image/png', 'image/webp']

/**
 * Max length of the text of a post, in graphemes (`app.bsky.feed.post`).
 *
 * To do: continue long captions in replies (a thread).
 */
const maxGraphemes = 300

/**
 * Photo to import.
 */
export interface Photo {
  /**
   * File.
   */
  data: Uint8Array

  /**
   * Caption.
   */
  description: string | null | undefined

  /**
   * Media type.
   */
  mimeType: ImageType

  /**
   * When it was uploaded.
   */
  uploadedTime: DateTime<true>
}

/**
 * Import into the repos of people,
 * for connected services (see `Oauth2Controller`),
 * with the session on the PDS of each person.
 */
export class ImportService {
  /**
   * Import a photo as a post.
   *
   * The record key comes from when it was uploaded and from the file,
   * so importing it again puts the same record.
   *
   * @param did
   *   DID of the person.
   * @param photo
   *   Photo.
   * @returns
   *   URI of the post.
   * @throws
   *   `ImageError` when the image cannot be read or made small enough.
   */
  async importPhoto(did: DidString, photo: Photo): Promise<string> {
    const image = await fitImage(photo.data, photo.mimeType, {
      maxSize: maxImageSize,
      types: imageTypes,
    })
    const client = await pdsSessionClient(did)
    const upload = await client.uploadBlob(image.data, { encoding: image.mimeType })
    const { blob } = upload.body
    const rkey = createTid(photo.uploadedTime.toMillis() * 1000, clockId(getBlobCidString(blob)))
    const embed = lexicon.app.bsky.embed.images.main.build({
      images: [{ alt: '', aspectRatio: image.aspectRatio, image: blob }],
    })

    const result = await client.put(
      lexicon.app.bsky.feed.post.main,
      {
        createdAt: toDatetimeString(photo.uploadedTime.toJSDate()),
        embed,
        text: truncate(photo.description ?? '', { max: maxGraphemes }),
      },
      { rkey }
    )

    return result.uri
  }
}

/**
 * Get a clock ID for a TID from a value: the same value gives the same ID.
 *
 * @param value
 *   Value.
 * @returns
 *   Clock ID (`0` to `1023`).
 */
function clockId(value: string): number {
  return createHash('sha256').update(value).digest().readUInt16BE(0) & 0x3_ff
}

export default new ImportService()
