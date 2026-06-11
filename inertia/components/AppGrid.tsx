import { Data } from '@generated/data'
import { App } from '~/components/App'

export function AppGrid({ apps }: { apps: Data.App[] }) {
  return (
    <ul
      role="list"
      className="mt-4 mb-8 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 md:grid-cols-3"
    >
      {apps.map((app) => (
        <App key={app.id} app={app} />
      ))}
    </ul>
  )
}
