import type { AtUriString, BlobRef } from '@atproto/lex'
import * as lexicon from '#lexicons'
import { type BlobLocator, type Context, toBlobLocator } from '#utils/blob'

type LexiconEmbed = NonNullable<lexicon.app.bsky.feed.post.Main['embed']>
type LexiconExternal = lexicon.app.bsky.embed.external.Main
type LexiconGallery = lexicon.app.bsky.embed.gallery.Main
type LexiconMedia = LexiconRecordWithMedia['media']
type LexiconImages = lexicon.app.bsky.embed.images.Main
type LexiconRecord = lexicon.app.bsky.embed.record.Main
type LexiconRecordWithMedia = lexicon.app.bsky.embed.recordWithMedia.Main

export type AspectRatio = {
  height: number
  width: number
}

export type Embed = Media | EmbedRecord

export type External = {
  description: string
  thumbnail: BlobLocator | undefined
  title: string
  type: 'external'
  uri: string
}

export type Images = {
  images: Array<Image>
  type: 'images'
}

export type Image = {
  alt: string
  aspectRatio: AspectRatio | undefined
  blob: BlobLocator
}

export type Media = External | Images | Unknown | Video

export type EmbedRecord = {
  media: Media | undefined
  type: 'record'
  uri: AtUriString
}

export type Unknown = {
  type: 'unknown'
}

export type Video = {
  type: 'video'
}

/**
 * Turn a lexicon value into a renderable value.
 *
 * @param value
 *   Value.
 * @param context
 *   DID + PDS.
 * @returns
 *   Normalized embed.
 */
export function toEmbed(value: LexiconEmbed, context: Context): Embed {
  if (lexicon.app.bsky.embed.record.main.isTypeOf(value)) {
    return recordToEmbed(value)
  }

  if (lexicon.app.bsky.embed.recordWithMedia.main.isTypeOf(value)) {
    return recordWithMediaToEmbed(value, context)
  }

  return mediaToEmbed(value, context)
}

function externalToEmbed(value: LexiconExternal, context: Context): External {
  return {
    description: value.external.description,
    thumbnail: value.external.thumb ? toBlobLocator(value.external.thumb, context) : undefined,
    title: value.external.title,
    type: 'external',
    uri: value.external.uri,
  }
}

function galleryToEmbed(value: LexiconGallery, context: Context): Images {
  const images: Array<Image> = []

  for (const item of value.items) {
    if (lexicon.app.bsky.embed.gallery.image.isTypeOf(item)) {
      images.push(toImage(item, context))
    }
  }

  return { images, type: 'images' }
}

function imagesToEmbed(value: LexiconImages, context: Context): Images {
  return {
    images: value.images.map((image) => toImage(image, context)),
    type: 'images',
  }
}

function mediaToEmbed(value: LexiconMedia, context: Context): Media {
  if (lexicon.app.bsky.embed.external.main.isTypeOf(value)) {
    return externalToEmbed(value, context)
  }

  if (lexicon.app.bsky.embed.images.main.isTypeOf(value)) {
    return imagesToEmbed(value, context)
  }

  if (lexicon.app.bsky.embed.video.main.isTypeOf(value)) {
    return videoToEmbed()
  }

  if (lexicon.app.bsky.embed.gallery.main.isTypeOf(value)) {
    return galleryToEmbed(value, context)
  }

  return unknownToEmbed()
}

function recordToEmbed(value: LexiconRecord): EmbedRecord {
  return { media: undefined, type: 'record', uri: value.record.uri }
}

function recordWithMediaToEmbed(value: LexiconRecordWithMedia, context: Context): EmbedRecord {
  const media = mediaToEmbed(value.media, context)
  return { media, type: 'record', uri: value.record.record.uri }
}

function toImage(
  value: { alt: string; aspectRatio?: AspectRatio | undefined; image: BlobRef },
  context: Context
): Image {
  return {
    alt: value.alt,
    aspectRatio: value.aspectRatio,
    blob: toBlobLocator(value.image, context),
  }
}

function unknownToEmbed(): Unknown {
  return { type: 'unknown' }
}

function videoToEmbed(): Video {
  return { type: 'video' }
}
