import { DateTime } from 'luxon'

/**
 * Cutoff before which an account is dormant.
 *
 * @returns
 *   Cutoff.
 */
export function dormancyCutoff(): DateTime<true> {
  return DateTime.now().minus({ months: 1 })
}
