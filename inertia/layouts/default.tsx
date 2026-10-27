import { Data } from '@generated/data'
import { usePage } from '@inertiajs/react'
import { ReactElement } from 'react'
import PublicNavbar from '~/components/PublicNavbar'
import DashboardNavbar from '~/components/DashboardNavbar'
import { AuthenticatedLayout } from '~/components/layouts/authenticated'
import BetaWarning from '~/components/BetaWarning'
import { FlashError } from '~/components/FlashError'
import { mainId, SkipLink } from '~/components/SkipLink'

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
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
        {children}
      </main>
    </div>
  )
}
