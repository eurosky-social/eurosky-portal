import { DateTime } from 'luxon'

/**
 * Cutoff before which an account is dormant.
 *
 * @returns
 *   ISO 8601-compliant string.
 */
export function dormancyCutoff(): string {
  return DateTime.now().minus({ months: 1 }).toISO()
}
