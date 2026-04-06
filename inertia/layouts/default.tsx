import { Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { ReactElement, useEffect } from 'react'
import PublicNavbar from '~/components/PublicNavbar'
import DashboardNavbar from '~/components/DashboardNavbar'
import { AuthenticatedLayout } from '~/components/layouts/authenticated'
import BetaWarning from '~/components/BetaWarning'

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
  const page = usePage()
  useEffect(() => {
    toast.dismiss()
  }, [page.url])

  if (children.props.flash.error) {
    toast.error(children.props.flash.error)
  }

  if (page.url.startsWith('/onboarding') || page.url.startsWith('/legal/')) {
    return (
      <div>
        <BetaWarning />
        {children.props.isAuthenticated ? (
          <DashboardNavbar className="lg:pe-4" />
        ) : (
          <PublicNavbar />
        )}
        <main className="mb-2">{children}</main>
        <Toaster position="top-center" richColors />
      </div>
    )
  }

  if (children.props.isAuthenticated) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>
  }

  return (
    <div>
      <BetaWarning />
      <PublicNavbar />
      <main className="mb-2">{children}</main>
      <Toaster position="top-center" richColors />
    </div>
  )
}
