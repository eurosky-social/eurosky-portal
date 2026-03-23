import { Data } from '@generated/data'
import { Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { ReactElement, useMemo } from 'react'
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
  Cog6ToothIcon,
  ArrowTopRightOnSquareIcon,
  LifebuoyIcon,
  LockClosedIcon,
} from '@heroicons/react/24/solid'

export function AuthenticatedLayout(props: { children: ReactElement<Data.SharedProps> }) {
  const {
    props: { authorizationServer },
    url,
  } = usePage()

  const manageUrl = useMemo(() => {
    return new URL('/account', authorizationServer).toString()
  }, [authorizationServer])

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
                <SidebarItem route="dashboard.show" current={url == '/dashboard'}>
                  <HomeIcon />
                  <SidebarLabel>Dashboard</SidebarLabel>
                </SidebarItem>
                <SidebarItem href={manageUrl} target="_blank" as={'a'}>
                  <Cog6ToothIcon />
                  <SidebarLabel className="flex gap-1">
                    Manage Account{' '}
                    <ArrowTopRightOnSquareIcon className="size-4 inline-block self-center" />
                  </SidebarLabel>
                </SidebarItem>
              </SidebarSection>
              <SidebarHeading className="mt-10 font-bold">Support</SidebarHeading>
              <SidebarSection>
                <SidebarItem href="https://help.eurosky.tech" target="_blank" as={'a'}>
                  <LifebuoyIcon />
                  <SidebarLabel>Help</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="https://eurosky.tech/faq" target="_blank" as={'a'}>
                  <QuestionMarkCircleIcon />
                  <SidebarLabel>FAQ</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="https://eurosky.tech/contact-us" target="_blank" as={'a'}>
                  <ChatBubbleOvalLeftEllipsisIcon />
                  <SidebarLabel>Contact Us</SidebarLabel>
                </SidebarItem>
                <SidebarItem route="legal.show" routeParams={{ document: 'terms' }}>
                  <DocumentTextIcon />
                  <SidebarLabel>Terms of Service</SidebarLabel>
                </SidebarItem>
                <SidebarItem route="legal.show" routeParams={{ document: 'privacy' }}>
                  <LockClosedIcon />
                  <SidebarLabel>Privacy Policy</SidebarLabel>
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
