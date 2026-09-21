import { StarIcon } from '@heroicons/react/24/solid'
import { useT } from '~/lib/i18n'

/**
 * @param properties
 *   Properties.
 * @param properties.value
 *   Value between `0` and `5` (both including).
 * @returns {Element}
 *   Result.
 */
export function Rating(properties: { value: number }): React.JSX.Element {
  const { value } = properties
  const { tPlain } = useT()
  const rounded = Math.round(value * 2) / 2
  const stars = Math.floor(rounded)
  const label = tPlain('apps.rating', { value })

  return (
    <span aria-label={label} className="flex items-center" role="img" title={label}>
      {Array.from({ length: stars }, (_, index) => (
        <StarIcon className="size-3.5" key={index} />
      ))}
      {rounded - stars === 0.5 && (
        <span className="size-3.5" style={{ marginLeft: '2px', marginTop: '-4px' }}>
          ½
        </span>
      )}
    </span>
  )
}
