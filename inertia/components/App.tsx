import { Data } from '@generated/data'
import clsx from 'clsx'
import { Avatar } from '~/lib/avatar'
import { Badge } from '~/lib/badge'
import { ClickableCard } from '~/lib/card'
import { Heading } from '~/lib/heading'
import { Link } from '~/lib/link'
import { Text } from '~/lib/text'
import { FavoriteButton } from './FavoriteButton'
import { Rating } from './Rating'
import { useT } from '~/lib/i18n'
import { formatNumber } from '~/utils/number'

/**
 * App card.
 *
 * Pass `favorite` (`boolean`) to show a toggle button.
 */
export function App({ app, favorite }: { app: Data.AppSummary; favorite?: boolean | undefined }) {
  const { locale, t } = useT()
  const favoritable = typeof favorite === 'boolean'

  return (
    <li className="relative col-span-1 flex rounded-md shadow-xs dark:shadow-none">
      <ClickableCard
        as={Link}
        className="w-full text-left focus:outline-hidden p-4 flex flex-col space-between gap-4"
        route="discover.app"
        routeParams={{ rkey: app.rkey }}
      >
        <div className="flex flex-row grow flex-1 gap-4">
          <div className="flex flex-col">
            <Heading level={4} className="text-base!" lang="en">
              {app.listing.name}
            </Heading>
            <Text
              className="overflow-hidden dark:text-slate-400!"
              style={{ WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, display: '-webkit-box' }}
              lang="en"
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
        {typeof app.listing.rating === 'string' || app.madeInEurope || favoritable ? (
          <div className={clsx('flex w-full items-center gap-2', favoritable && 'min-h-6 pr-10')}>
            {typeof app.listing.rating === 'string' ? (
              <span className="flex items-center gap-0.5 text-sm text-amber-500">
                <Rating value={parseFloat(app.listing.rating)} />
                <span className="text-gray-400 dark:text-slate-500 ml-0.5">
                  ({formatNumber(app.listing.reviewCount, locale)})
                </span>
              </span>
            ) : undefined}
            {app.madeInEurope ? (
              <Badge color="blue" className="ml-auto">
                {t('apps.madeInEurope')}
              </Badge>
            ) : undefined}
          </div>
        ) : undefined}
      </ClickableCard>
      {favoritable ? (
        <FavoriteButton
          className="absolute right-4 bottom-4"
          compact
          favorite={favorite}
          name={app.listing.name}
          rkey={app.rkey}
        />
      ) : undefined}
    </li>
  )
}
