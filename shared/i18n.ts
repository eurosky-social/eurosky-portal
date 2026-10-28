import en from '#shared/i18n/en'

/**
 * Message key (in `shared/i18n/`).
 */
export type MessageKey = keyof typeof en

/**
 * Check if something is a known message key.
 *
 * @param value
 *   Value to check.
 * @returns
 *   Whether the value is a known message key.
 */
export function isMessageKey(value: unknown): value is MessageKey {
  return typeof value === 'string' && Object.hasOwn(en, value)
}
