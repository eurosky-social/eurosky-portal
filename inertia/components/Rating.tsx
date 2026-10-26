import { StarIcon } from '@heroicons/react/24/solid'
import { useT } from '~/lib/i18n'
import { formatNumber } from '~/utils/number'

interface Properties {
  /**
   * Review count.
   */
  count: number

  /**
   * Total rating (between `0` and `5`).
   */
  value: number
}

/**
 * @param properties
 *   Properties.
 * @returns {Element}
 *   Result.
 */
export function Rating(properties: Properties): React.JSX.Element {
  const { count, value } = properties
  const { locale, tPlain } = useT()
  const rounded = Math.round(value * 2) / 2
  const stars = Math.floor(rounded)
  const label = tPlain('apps.rating', { count, value })

  return (
    <span
      aria-label={label}
      className="flex items-center gap-0.5 text-sm text-amber-600 dark:text-amber-500"
      role="img"
      title={label}
    >
      <span className="flex items-center">
        {Array.from({ length: stars }, (_, index) => (
          <StarIcon className="size-3.5" key={index} />
        ))}
        {rounded - stars === 0.5 && (
          <span className="size-3.5" style={{ marginLeft: '2px', marginTop: '-4px' }}>
            ½
          </span>
        )}
      </span>
      <span className="ml-0.5 text-zinc-500 dark:text-zinc-400">
        ({formatNumber(count, locale)})
      </span>
    </span>
  )
}
