import { Data } from '@generated/data'
import { Avatar } from '~/lib/avatar'
import { Badge } from '~/lib/badge'
import { ClickableCard } from '~/lib/card'
import { Heading } from '~/lib/heading'
import { Text } from '~/lib/text'
import { StarIcon } from '@heroicons/react/24/solid'

export function App({ app }: { app: Data.App }) {
  return (
    <li className="col-span-1 flex rounded-md shadow-xs dark:shadow-none">
      <ClickableCard
        href={app.externalUrl}
        target="_blank"
        className="w-full focus:outline-hidden p-4 flex flex-col space-between gap-4"
      >
        <div className="flex flex-row grow flex-1 gap-4">
          <div className="flex flex-col">
            <Heading level={4} className="text-base!">
              {app.listing.name}
            </Heading>
            <Text
              className="overflow-hidden dark:text-slate-400!"
              style={{ WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, display: '-webkit-box' }}
            >
              {app.listing.tagline}
            </Text>
          </div>
          <Avatar
            square
            src={app.listing.iconUrl}
            className="size-12 mb-2 bg-gray-100 ml-auto dark:bg-gray-800 outline-none!"
          />
        </div>
        {typeof app.listing.rating === 'string' ? (
          <div className="flex flex-row space-between gap-0.5">
            <span className="flex items-center gap-0.5 text-sm text-amber-500">
              <Rating value={parseFloat(app.listing.rating)} />
              <span className="text-gray-400 dark:text-slate-500 ml-0.5">
                ({app.listing.reviewCount})
              </span>
            </span>
          </div>
        ) : undefined}
        <div className="flex w-full items-center gap-2">
          {app.madeInEurope ? (
            <Badge color="blue" className="ml-auto">
              Made in Europe
            </Badge>
          ) : undefined}
        </div>
      </ClickableCard>
    </li>
  )
}

/**
 * @param properties
 *   Properties.
 * @param properties.value
 *   Value between `0` and `5` (both including).
 * @returns {Element}
 *   Result.
 */
function Rating(properties: { value: number }): React.JSX.Element {
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
