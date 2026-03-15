import { Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { ReactElement, useEffect } from 'react'
import PublicNavbar from '~/components/PublicNavbar'
import DashboardNavbar from '~/components/DashboardNavbar'
import {
  Sidebar,
  SidebarBody,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from '~/lib/sidebar'
import { SidebarLayout } from '~/lib/sidebar-layout'
import {
  HomeIcon,
  QuestionMarkCircleIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/solid'

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
  useEffect(() => {
    toast.dismiss()
  }, [usePage().url])

  if (children.props.flash.error) {
    toast.error(children.props.flash.error)
  }

  if (children.props.isAuthenticated) {
    return <AuthLayout>{children}</AuthLayout>
  }

  return (
    <div>
      {children.props.isAuthenticated ? <DashboardNavbar /> : <PublicNavbar />}
      <main>{children}</main>
      <Toaster position="top-center" richColors />
    </div>
  )
}

function AuthLayout(props: { children: ReactElement<Data.SharedProps> }) {
  return (
    <div>
      <DashboardNavbar />
      <SidebarLayout
        navbar={<div />}
        sidebar={
          <Sidebar>
            <SidebarBody>
              <SidebarHeading className="font-bold">My Account</SidebarHeading>
              <SidebarSection>
                <SidebarItem route="dashboard.show">
                  <HomeIcon />
                  <SidebarLabel>Dashboard</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
              <SidebarHeading className="mt-10 font-bold">Support</SidebarHeading>
              <SidebarSection>
                <SidebarItem href="#">
                  <QuestionMarkCircleIcon />
                  <SidebarLabel>Help &amp; FAQ</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="#">
                  <ChatBubbleOvalLeftEllipsisIcon />
                  <SidebarLabel>Contact Us</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="#">
                  <DocumentTextIcon />
                  <SidebarLabel>Terms</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
            </SidebarBody>
          </Sidebar>
        }
        children={
          <>
            <main>{props.children}</main>
            <Toaster position="top-center" richColors />
          </>
        }
      />
    </div>
  )
}
