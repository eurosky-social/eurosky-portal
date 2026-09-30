import { Form } from '@adonisjs/inertia/react'
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { Button, TouchTarget } from '~/lib/button'
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
          // Sits in a 24px row: 32px (`size-8`) with `-m-1`, for a bigger target.
          <button
            aria-label={tPlain(favorite ? 'apps.removeFavoriteNamed' : 'apps.addFavoriteNamed', {
              name,
            })}
            className="relative -m-1 flex size-8 cursor-pointer items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-950/5 hover:text-zinc-500 focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-400 *:data-[slot=icon]:size-5"
            disabled={processing}
            title={tPlain(favorite ? 'apps.detail.removeFavorite' : 'apps.detail.addFavorite')}
            type="submit"
          >
            <TouchTarget>{icon}</TouchTarget>
          </button>
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
