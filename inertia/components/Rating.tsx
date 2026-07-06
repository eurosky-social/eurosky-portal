import { StarIcon } from '@heroicons/react/24/solid'

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
  const rounded = Math.round(value * 2) / 2
  const stars = Math.floor(rounded)

  return (
    <span
      aria-label={value + ' out of 5'}
      className="flex items-center"
      role="img"
      title={value + ' out of 5'}
    >
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
