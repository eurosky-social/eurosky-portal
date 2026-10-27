import { Data } from '@generated/data'
import { usePage } from '@inertiajs/react'
import { ReactElement } from 'react'
import PublicNavbar from '~/components/PublicNavbar'
import DashboardNavbar from '~/components/DashboardNavbar'
import { AuthenticatedLayout } from '~/components/layouts/authenticated'
import BetaWarning from '~/components/BetaWarning'
import { FlashError } from '~/components/FlashError'
import { Footer } from '~/components/Footer'
import { mainId, SkipLink } from '~/components/SkipLink'

interface Properties {
  /**
   * Page.
   */
  children: ReactElement<Data.SharedProps>

  /**
   * Whether the page goes edge to edge (default: `false`).
   */
  bleed?: boolean
}

export default function Layout(properties: Properties) {
  const { bleed, children } = properties
  const page = usePage()

  if (page.url.startsWith('/onboarding')) {
    return (
      <div>
        <SkipLink />
        <BetaWarning />
        <FlashError />
        <DashboardNavbar className="lg:pe-4" />
        <main className="mb-2" id={mainId} tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </div>
    )
  }

  if (children.props.isAuthenticated) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>
  }

  return (
    <div>
      <SkipLink />
      <BetaWarning />
      <FlashError />
      <PublicNavbar />
      <main className="mb-2" id={mainId} tabIndex={-1}>
        {bleed ? children : <div className="mx-auto max-w-7xl p-6 lg:p-10">{children}</div>}
      </main>
      <Footer />
    </div>
  )
}
