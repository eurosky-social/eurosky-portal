import type { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

/**
 * Format a Luxon `DateTime` the same way Lucid formats `@column.dateTime()`
 * values when persisting them, so it can be compared against such a column
 * in a raw query condition.
 *
 * @param value
 *   Value to format.
 * @returns
 *   Value formatted like a stored `dateTime` column.
 */
export function toSqlDateTime(value: DateTime): string {
  return value.toFormat(db.connection().dialect.dateTimeFormat)
}
