import { Form } from '@adonisjs/inertia/react'
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { Button } from '~/lib/button'
import { useT } from '~/lib/i18n'

interface Properties {
  /**
   * Class name for the form.
   */
  className?: string

  /**
   * Whether to display a compact, icon-only style.
   */
  compact?: boolean

  /**
   * Whether the app is currently favorited.
   */
  favorite: boolean

  /**
   * Name of the app.
   */
  name: string

  /**
   * Unique key for the app, used in routing.
   */
  rkey: string
}

/**
 * Add an app to your apps or remove it from there.
 */
export function FavoriteButton(properties: Properties) {
  const { className, compact, favorite, name, rkey } = properties
  const { t, tPlain } = useT()
  const icon = favorite ? (
    <HeartSolidIcon className="text-rose-500!" data-slot="icon" />
  ) : (
    <HeartOutlineIcon data-slot="icon" />
  )
  return (
    <Form
      className={className}
      options={{ preserveScroll: true }}
      route={favorite ? 'discover.unfavorite' : 'discover.favorite'}
      routeParams={{ rkey }}
    >
      {({ processing }) =>
        compact ? (
          // Sits in a 24px row: 40px (`size-10`) with `-m-2`, for a bigger target.
          <Button
            aria-label={tPlain(favorite ? 'apps.removeFavoriteNamed' : 'apps.addFavoriteNamed', {
              name,
            })}
            className="-m-2"
            disabled={processing}
            icon
            title={tPlain(favorite ? 'apps.detail.removeFavorite' : 'apps.detail.addFavorite')}
            type="submit"
          >
            {icon}
          </Button>
        ) : (
          <Button disabled={processing} outline type="submit">
            {icon}
            {favorite ? t('apps.detail.removeFavorite') : t('apps.detail.addFavorite')}
          </Button>
        )
      }
    </Form>
  )
}
