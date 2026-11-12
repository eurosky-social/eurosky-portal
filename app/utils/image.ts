import sharp, { type Metadata } from 'sharp'

/**
 * Longest side, in pixels, of images made smaller.
 */
const maxSide = 2000

/**
 * Max times to encode an image to make it small enough.
 */
const maxTries = 4

/**
 * JPEG quality of images made smaller.
 */
const quality = 85

/**
 * Error for an image that cannot be used, such as one that cannot be read.
 */
export class ImageError extends Error {}

/**
 * Image media type.
 */
export type ImageType = `image/${string}`

/**
 * Configuration for {@linkcode fitImage}.
 */
export interface FitImageOptions {
  /**
   * Max size, in bytes.
   */
  maxSize: number

  /**
   * Media types to keep; others are converted to JPEG.
   */
  types: ReadonlyArray<ImageType>
}

/**
 * Image that fits.
 */
export interface FittedImage {
  /**
   * Width and height, as shown.
   */
  aspectRatio: { height: number; width: number }

  /**
   * File.
   */
  data: Uint8Array

  /**
   * Media type.
   */
  mimeType: ImageType
}

/**
 * Check whether a (normalized) media type is an image type.
 *
 * @param value
 *   Media type.
 * @returns
 *   Whether it is an image type.
 */
export function isImageType(value: string): value is ImageType {
  return /^image\/[\w.+-]+$/.test(value)
}

/**
 * Make an image fit:
 * get its aspect ratio,
 * and convert it to JPEG if of another type,
 * or make it smaller as a JPEG if too large,
 * keeping its metadata (such as its color profile).
 *
 * @param data
 *   File.
 * @param mimeType
 *   Media type.
 * @param options
 *   Configuration (required).
 * @returns
 *   Image.
 * @throws
 *   When the image cannot be read or made small enough.
 */
export async function fitImage(
  data: Uint8Array,
  mimeType: ImageType,
  options: FitImageOptions
): Promise<FittedImage> {
  const { maxSize, types } = options
  let metadata: Metadata | undefined

  try {
    metadata = await sharp(data).metadata()
  } catch {}

  const { height, width } = metadata?.autoOrient ?? {}

  if (!height || !width) throw new ImageError('Cannot read image')

  if (data.byteLength <= maxSize && types.includes(mimeType)) {
    return { aspectRatio: { height, width }, data, mimeType }
  }

  let side = Math.min(maxSide, Math.max(height, width))

  for (let tries = 0; tries < maxTries; tries++) {
    const result = await sharp(data)
      // Store pixels as shown (photos are often stored sideways, with an
      // orientation); this resets the orientation, as metadata is kept.
      .autoOrient()
      .resize({ fit: 'inside', height: side, width: side, withoutEnlargement: true })
      // JPEG has no transparency.
      .flatten({ background: '#ffffff' })
      .jpeg({ mozjpeg: true, quality })
      .keepMetadata()
      .toBuffer({ resolveWithObject: true })

    if (result.data.byteLength <= maxSize) {
      return {
        aspectRatio: { height: result.info.height, width: result.info.width },
        data: result.data,
        mimeType: 'image/jpeg',
      }
    }

    // Size grows about with the number of pixels,
    // so scale both sides by the square root of how much too large it is,
    // with a margin.
    const scale = Math.sqrt(maxSize / result.data.byteLength) * 0.95
    side = Math.floor(Math.max(result.info.height, result.info.width) * scale)

    if (side < 1) break
  }

  throw new ImageError('Cannot make image small enough')
}
