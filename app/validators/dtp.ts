import vine from '@vinejs/vine'

/**
 * Media item as DTP sends it (`MediaSerializer.java` there):
 * albums first, then videos, then photos.
 *
 * Also sent but not used: `schemaSource` (URL of `MediaSerializer.java`).
 */
export const dtpMediaValidator = vine.create({
  '@type': vine.literal('GenericPayload'),
  /**
   * Version of the data (such as `'0.1.0'`).
   */
  'apiVersion': vine.string(),
  'payload': vine
    .object({
      '@type': vine.enum(['Album', 'Photo', 'Video'] as const),
      /**
       * ID of the album an item is in, if any (photos, videos).
       */
      'albumId': vine.string().nullable().optional(),
      /**
       * Caption (photos, videos) or description (albums), if any.
       */
      'description': vine.string().nullable().optional(),
      /**
       * Whether it is a favorite, if known (photos, videos).
       */
      'favoriteInfo': vine
        .object({
          favorite: vine.boolean(),
          lastUpdateTime: vine.string().nullable().optional(),
        })
        .allowUnknownProperties()
        .nullable()
        .optional(),
      /**
       * ID (albums).
       */
      'id': vine.string().nullable().optional(),
      /**
       * Name (albums) or file name (photos, videos).
       */
      'name': vine.string().nullable().optional(),
      /**
       * When it was uploaded (ISO 8601), if known (photos, videos).
       */
      'uploadedTime': vine.string().nullable().optional(),
    })
    .allowUnknownProperties(),
})
