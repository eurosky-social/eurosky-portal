import { Data } from '@generated/data'
import { App } from '~/components/App'

/**
 * Grid of app cards.
 *
 * Pass `favorites` (URIs of apps) to show hearts (when logged in).
 */
export function AppGrid({
  apps,
  favorites,
}: {
  apps: Data.AppSummary[]
  favorites?: ReadonlyArray<string> | undefined
}) {
  return (
    <ul
      role="list"
      className="mt-4 mb-8 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 md:grid-cols-3"
    >
      {apps.map((app) => (
        <App
          key={app.atUri}
          app={app}
          favorite={favorites ? favorites.includes(app.atUri) : undefined}
        />
      ))}
    </ul>
  )
}
