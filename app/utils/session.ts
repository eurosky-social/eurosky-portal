/**
 * Typed version of Adonis session helpers.
 */

import type { Session } from '@adonisjs/session'
import type { MessageKey } from '#shared/i18n'
import type { Source } from '#events/auth_flow_completed'
import type { FavoriteIntent } from '#services/favorite_service'

/**
 * Message to show on the next page;
 * translated there, so it follows the locale when that changes.
 */
export type FlashMessage = {
  /**
   * Message key (in `shared/i18n/`).
   */
  key: MessageKey

  /**
   * Values for placeholders in the message.
   */
  values?: Record<string, string>
}

/**
 * Values we flash to the next request, by key.
 *
 * Adonis types flash messages as `any`;
 * go through the functions here to get these types instead.
 */
interface FlashValues {
  /**
   * Pages in history are stale (such as after favoriting); clear them.
   */
  clearHistory: true

  /**
   * Error to show, shown as `flash.error`.
   */
  errorMessage: FlashMessage

  /**
   * Errors flashed by Adonis, by code (such as `E_UNAUTHORIZED_ACCESS`);
   * if there is no `errorMessage`,
   * the first that is not `E_VALIDATION_ERROR` is shown as `flash.error`.
   */
  errorsBag: Record<string, string>
}

/**
 * Values we keep in the session, by key.
 *
 * Adonis types session values as `any`;
 * go through the functions here to get these types instead.
 */
interface SessionValues {
  /**
   * Favorite to finish after asking for more scopes.
   */
  favorite_intent: FavoriteIntent
  /**
   * Handle or other input that started a login.
   */
  handle: string
  /**
   * State tying an OAuth flow to this browser (see `createState`).
   */
  oauth_state: string
  /**
   * Which flow the OAuth callback finishes.
   */
  source: Source
  /**
   * ISO 8601 date of when the terms were accepted during signup.
   */
  terms_accepted: string
}

/**
 * Flash a value to the next request.
 *
 * @param session
 *   Session object.
 * @param key
 *   Key.
 * @param value
 *   Value.
 * @returns
 *   Nothing.
 */
export function flashSessionValue<Key extends keyof FlashValues>(
  session: Session,
  key: Key,
  value: FlashValues[Key]
): undefined {
  session.flash(key, value)
}

/**
 * Remove a value from the session.
 *
 * @param session
 *   Session object.
 * @param key
 *   Key.
 * @returns
 *   Nothing.
 */
export function forgetSessionValue(session: Session, key: keyof SessionValues): undefined {
  session.forget(key)
}

/**
 * Get a value flashed by the previous request.
 *
 * @param session
 *   Session object.
 * @param key
 *   Key.
 * @returns
 *   Value, if any.
 */
export function getFlashedSessionValue<Key extends keyof FlashValues>(
  session: Session,
  key: Key
): FlashValues[Key] | undefined {
  return session.flashMessages.get(key)
}

/**
 * Get and remove a value from the session.
 *
 * @param session
 *   Session object.
 * @param key
 *   Key.
 * @returns
 *   Value, if any.
 */
export function pullSessionValue<Key extends keyof SessionValues>(
  session: Session,
  key: Key
): SessionValues[Key] | undefined {
  return session.pull(key)
}

/**
 * Store a value in the session.
 *
 * @param session
 *   Session object.
 * @param key
 *   Key.
 * @param value
 *   Value.
 * @returns
 *   Nothing.
 */
export function putSessionValue<Key extends keyof SessionValues>(
  session: Session,
  key: Key,
  value: SessionValues[Key]
): undefined {
  session.put(key, value)
}
