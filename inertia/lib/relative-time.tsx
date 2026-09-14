import type { RelativeTimeElement } from '@github/relative-time-element'
import { formatDate } from '~/utils/date'

// Explicitly import for side-effects (registering the custom element).
import '@github/relative-time-element'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'relative-time': React.DetailedHTMLProps<
        React.HTMLAttributes<RelativeTimeElement>,
        RelativeTimeElement
      > &
        Partial<Omit<RelativeTimeElement, keyof HTMLElement>>
    }
  }
}

/**
 * Configuration (required).
 */
interface Properties {
  /**
   * ISO 8601 date string (required).
   */
  value: string | null | undefined
}

/**
 * Relative and self-updating date (such as “3 days ago”).
 * Full date is shown for things that are long ago,
 * and also in `aria-label` and `title`.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Relative time.
 */
export function RelativeTime(properties: Properties) {
  const { value } = properties
  if (!value) return
  const absolute = formatDate(value)
  if (!absolute) return
  return (
    <relative-time aria-label={absolute} datetime={value} tense="past">
      {absolute}
    </relative-time>
  )
}
