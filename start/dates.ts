import { Settings } from 'luxon'

// Lucid stores `@column.dateTime()` values as zone-less strings so fix this
// regardless of `TZ` environment variable.
Settings.defaultZone = 'utc'
