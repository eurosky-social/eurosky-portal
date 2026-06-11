import { Data } from '@generated/data'
import { AppGrid } from '~/components/AppGrid'

type Apps = {
  gettingStarted: Data.App[]
  exploreMore: Data.App[]
  forWork: Data.App[]
}

export function Apps({ apps }: { apps: Apps }) {
  const headingStyle = 'mt-8 mb-4 text-lg font-semibold text-neutral-400 dark:text-slate-400'

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
