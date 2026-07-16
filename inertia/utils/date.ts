/**
 * Format an ISO 8601 date string for display.
 *
 * @param value
 *   ISO 8601 date string.
 * @returns
 *   Human-readable date.
 */
export function formatDate(value: string | null | undefined): string | undefined {
  if (!value) return
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return
  return date.toLocaleString(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
