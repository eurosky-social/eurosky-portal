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
  ClockIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
  LifebuoyIcon,
  LockClosedIcon,
} from '@heroicons/react/24/solid'
import { useAuth } from '~/utils/use_auth'
import { Form } from '@adonisjs/inertia/react'
import { Button } from '~/lib/button'
import BetaWarning from '~/components/BetaWarning'
import { useT } from '~/lib/i18n'

export function AuthenticatedLayout(props: { children: ReactElement<Data.SharedProps> }) {
  const {
    props: { authorizationServer },
    url,
  } = usePage()
  const user = useAuth()
  const { t } = useT()

  const manageUrl = useMemo(() => {
    return new URL('/account', authorizationServer).toString()
  }, [authorizationServer])

  return (
    <>
      <BetaWarning />
      <div className="dashboard">
        <div className="hidden lg:block">
          <DashboardNavbar className="lg:pe-4" />
        </div>
        <SidebarLayout
          navbar={<DashboardNavbar />}
          sidebar={
            <Sidebar>
              <SidebarBody>
                <SidebarHeading className="font-bold">{t('sidebar.myAccount')}</SidebarHeading>
                <SidebarSection>
                  <SidebarItem route="dashboard.show" current={url == '/dashboard'}>
                    <HomeIcon />
                    <SidebarLabel>{t('sidebar.dashboard')}</SidebarLabel>
                  </SidebarItem>
                  <SidebarItem route="activity.show" current={url.startsWith('/activity')}>
                    <ClockIcon />
                    <SidebarLabel>{t('sidebar.yourActivity')}</SidebarLabel>
                  </SidebarItem>
                  <SidebarItem href={manageUrl} target="_blank" as={'a'}>
                    <Cog6ToothIcon />
                    <SidebarLabel className="flex gap-1">
                      {t('sidebar.manageAccount')}{' '}
                      <ArrowTopRightOnSquareIcon className="size-4 inline-block self-center" />
                    </SidebarLabel>
                  </SidebarItem>
                </SidebarSection>
                <SidebarHeading className="mt-10 font-bold">{t('sidebar.discover')}</SidebarHeading>
                <SidebarSection>
                  <SidebarItem href="/apps" current={url.startsWith('/apps')}>
                    <GlobeAltIcon />
                    <SidebarLabel>{t('sidebar.applications')}</SidebarLabel>
                  </SidebarItem>
                </SidebarSection>
                <SidebarHeading className="mt-10 font-bold">{t('sidebar.support')}</SidebarHeading>
                <SidebarSection>
                  <SidebarItem href="https://eurosky.tech/help/" target="_blank" as={'a'}>
                    <LifebuoyIcon />
                    <SidebarLabel>{t('sidebar.help')}</SidebarLabel>
                  </SidebarItem>
                  <SidebarItem route="faq.show">
                    <QuestionMarkCircleIcon />
                    <SidebarLabel>{t('sidebar.faq')}</SidebarLabel>
                  </SidebarItem>
                  <SidebarItem href="https://eurosky.tech/contact/" target="_blank" as={'a'}>
                    <ChatBubbleOvalLeftEllipsisIcon />
                    <SidebarLabel>{t('sidebar.contactUs')}</SidebarLabel>
                  </SidebarItem>
                  <SidebarItem href="https://eurosky.tech/accounts/terms/" target="_blank" as={'a'}>
                    <DocumentTextIcon />
                    <SidebarLabel>{t('sidebar.termsOfService')}</SidebarLabel>
                  </SidebarItem>
                  <SidebarItem
                    href="https://eurosky.tech/accounts/privacy/"
                    target="_blank"
                    as={'a'}
                  >
                    <LockClosedIcon />
                    <SidebarLabel>{t('sidebar.privacyPolicy')}</SidebarLabel>
                  </SidebarItem>
                </SidebarSection>
              </SidebarBody>
              <SidebarFooter className="lg:hidden">
                <SidebarSection>
                  <SidebarItem as={'div'} className="pointer-events-none">
                    <SidebarLabel>@{user.handle}</SidebarLabel>
                  </SidebarItem>
                  <SidebarItem as={'div'}>
                    <Form route="oauth.logout" className="w-full flex justify-stretch">
                      <Button type="submit" className="w-full text-left dark:bg-slate-800">
                        {t('nav.logout')}
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
    </>
  )
}
