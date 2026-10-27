import { Data } from '@generated/data'
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
  LifebuoyIcon,
  LockClosedIcon,
  StarIcon,
} from '@heroicons/react/24/solid'
import { Form } from '@adonisjs/inertia/react'
import { Button } from '~/lib/button'
import BetaWarning from '~/components/BetaWarning'
import { FlashError } from '~/components/FlashError'
import { Footer } from '~/components/Footer'
import { NewTab } from '~/components/NewTab'
import { LanguageToggle } from '~/components/LanguageToggle'
import { ThemeToggle } from '~/components/ThemeToggle'
import { SkipLink } from '~/components/SkipLink'
import { useT } from '~/lib/i18n'
import { links } from '#shared/links'

export function AuthenticatedLayout(props: { children: ReactElement<Data.SharedProps> }) {
  const {
    props: { authorizationServer },
    url,
  } = usePage()
  const { t, tPlain } = useT()

  const manageUrl = useMemo(() => {
    return new URL('/account', authorizationServer).toString()
  }, [authorizationServer])

  return (
    <>
      <SkipLink />
      <BetaWarning />
      <FlashError />
      <div className="dashboard">
        <div className="hidden lg:block">
          <DashboardNavbar className="lg:pe-4" />
        </div>
        <SidebarLayout
          navbar={<DashboardNavbar actions={false} />}
          sidebar={
            <Sidebar aria-label={tPlain('nav.sidebar')}>
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
                  <SidebarItem route="dashboard.apps" current={url.startsWith('/dashboard/apps')}>
                    <StarIcon />
                    <SidebarLabel>{t('sidebar.yourApps')}</SidebarLabel>
                  </SidebarItem>
                  <SidebarItem href={manageUrl} target="_blank" as={'a'}>
                    <Cog6ToothIcon />
                    <SidebarLabel>
                      {t('sidebar.manageAccount')}
                      <NewTab />
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
                  <SidebarItem href={links.help} target="_blank" as={'a'}>
                    <LifebuoyIcon />
                    <SidebarLabel>
                      {t('sidebar.help')}
                      <NewTab />
                    </SidebarLabel>
                  </SidebarItem>
                  <SidebarItem route="faq.show" current={url.startsWith('/faq')}>
                    <QuestionMarkCircleIcon />
                    <SidebarLabel>{t('sidebar.faq')}</SidebarLabel>
                  </SidebarItem>
                  <SidebarItem href={links.contact} target="_blank" as={'a'}>
                    <ChatBubbleOvalLeftEllipsisIcon />
                    <SidebarLabel>
                      {t('sidebar.contactUs')}
                      <NewTab />
                    </SidebarLabel>
                  </SidebarItem>
                  <SidebarItem href={links.terms} target="_blank" as={'a'}>
                    <DocumentTextIcon />
                    <SidebarLabel>
                      {t('sidebar.termsOfService')}
                      <NewTab />
                    </SidebarLabel>
                  </SidebarItem>
                  <SidebarItem href={links.privacy} target="_blank" as={'a'}>
                    <LockClosedIcon />
                    <SidebarLabel>
                      {t('sidebar.privacyPolicy')}
                      <NewTab />
                    </SidebarLabel>
                  </SidebarItem>
                </SidebarSection>
              </SidebarBody>
              <SidebarFooter className="lg:hidden">
                <SidebarSection>
                  <SidebarItem as={'div'}>
                    <Form route="oauth.logout" className="w-full flex justify-stretch">
                      <Button type="submit" className="w-full">
                        {t('nav.logout')}
                      </Button>
                    </Form>
                  </SidebarItem>
                </SidebarSection>
                <div className="mt-2 flex justify-end gap-2">
                  <ThemeToggle />
                  <LanguageToggle />
                </div>
              </SidebarFooter>
            </Sidebar>
          }
          children={props.children}
        />
        <Footer panelAbove />
      </div>
    </>
  )
}
