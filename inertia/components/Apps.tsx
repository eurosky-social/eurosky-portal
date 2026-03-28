import { Data } from '@generated/data'
import clsx from 'clsx'
import { App } from '~/components/App'

export type Apps = {
  gettingStarted: Data.App[]
  exploreMore: Data.App[]
  forWork: Data.App[]
}

export function Apps({ apps, color }: { apps: Apps; color?: 'gray' | 'slate' }) {
  const headingStyle = clsx(
    'text-lg',
    color == 'slate' ? 'text-slate-400 dark:text-slate-400' : 'text-gray-400 dark:text-gray-400'
  )

  return (
    <>
      <h3 className={headingStyle}>Getting started</h3>
      <AppGrid apps={apps.gettingStarted} />

      <h3 className={headingStyle}>Explore more</h3>
      <AppGrid apps={apps.exploreMore} />

      <h3 className={headingStyle}>For work</h3>
      <AppGrid apps={apps.forWork} />
    </>
  )
}

function AppGrid({ apps }: { apps: Data.App[] }) {
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
