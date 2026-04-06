import { Data } from '@generated/data'
import { Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { ReactElement, useMemo } from 'react'
import DashboardNavbar from '~/components/DashboardNavbar'
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
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
  FingerPrintIcon,
} from '@heroicons/react/24/solid'
import { UserAvatar } from '../UserAvatar'
import { useAuth } from '~/utils/use_auth'
import { Form } from '@adonisjs/inertia/react'
import { Button } from '~/lib/button'

export function AuthenticatedLayout(props: { children: ReactElement<Data.SharedProps> }) {
  const {
    props: { authorizationServer },
    url,
  } = usePage()
  const user = useAuth()

  const manageUrl = useMemo(() => {
    return new URL('/account', authorizationServer).toString()
  }, [authorizationServer])

  const changePasswordUrl = useMemo(() => {
    return new URL('/.well-known/change-password', authorizationServer).toString()
  }, [authorizationServer])

  return (
    <div className="dashboard">
      <div className="hidden lg:block">
        <DashboardNavbar className="lg:pe-4" />
      </div>
      <SidebarLayout
        navbar={<DashboardNavbar />}
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
                <SidebarItem href={changePasswordUrl} target="_blank" as={'a'}>
                  <FingerPrintIcon />
                  <SidebarLabel className="flex gap-1">
                    Change Password{' '}
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
                <SidebarItem href="https://eurosky.tech/contact/" target="_blank" as={'a'}>
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
            <SidebarFooter className="lg:hidden">
              <SidebarSection>
                <SidebarItem as={'div'} className="pointer-events-none">
                  <UserAvatar user={user} />
                  <SidebarLabel>@{user.handle}</SidebarLabel>
                </SidebarItem>
                <SidebarItem>
                  <Form route="oauth.logout" className="w-full flex justify-stretch">
                    <Button type="submit" className="w-full text-left dark:bg-slate-800">
                      Logout
                    </Button>
                  </Form>
                </SidebarItem>
              </SidebarSection>
            </SidebarFooter>
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
