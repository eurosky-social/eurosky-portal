import { Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { ReactElement, useEffect } from 'react'
import PublicNavbar from '~/components/PublicNavbar'
import DashboardNavbar from '~/components/DashboardNavbar'
import { AuthenticatedLayout } from '~/components/layouts/authenticated'

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
        {children.props.isAuthenticated ? <DashboardNavbar /> : <PublicNavbar />}
        {children}
      </div>
    )
  }

  if (children.props.isAuthenticated) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>
  }

  return (
    <div>
      {children.props.isAuthenticated ? <DashboardNavbar /> : <PublicNavbar />}
      <main>{children}</main>
      <Toaster position="top-center" richColors />
    </div>
  )
}
