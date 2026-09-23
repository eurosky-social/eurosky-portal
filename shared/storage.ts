/**
 * Categories.
 */
export const storageCategories = ['image', 'video', 'other'] as const

/**
 * Category.
 */
export type StorageCategory = (typeof storageCategories)[number]

/**
 * Check whether a value is a known storage category.
 *
 * @param value
 *   Value to check.
 * @returns
 *   Whether the value is a known category.
 */
export function isStorageCategory(value: unknown): value is StorageCategory {
  return (storageCategories as ReadonlyArray<unknown>).includes(value)
}
