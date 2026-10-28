import { Link } from '~/lib/link'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '~/lib/navbar'
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from '~/lib/sidebar'
import { MobileSidebar, OpenMenuIcon } from '~/lib/sidebar-layout'
import { Logo } from './Logo'
import { LanguageToggle } from './LanguageToggle'
import { ThemeToggle } from './ThemeToggle'
import { Button } from '~/lib/button'
import { usePage } from '@inertiajs/react'
import { useState } from 'react'
import { links } from '#shared/links'
import { useT } from '~/lib/i18n'
import { NewTab } from './NewTab'

export default function PublicNavbar() {
  const page = usePage()
  const { tPlain, t } = useT()
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <Navbar
      aria-label={tPlain('nav.main')}
      className="gap-2! md:gap-4! md:px-6 px-3 sticky top-0 z-50 border-b border-stone-light bg-cotton/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95"
    >
      <Link route="home" aria-label={tPlain('nav.home')} className="pb-3 mt-1">
        <Logo />
      </Link>
      <NavbarSpacer />
      <NavbarSection className="max-md:hidden">
        <NavbarItem route="home" current={page.url === '/'}>
          {t('nav.about')}
        </NavbarItem>
        <NavbarItem route="discover.apps" current={page.url.startsWith('/apps')}>
          {t('nav.apps')}
        </NavbarItem>
        <NavbarItem href={links.privacy} target="_blank">
          <span>
            {t('nav.privacy')}
            <NewTab icon={false} />
          </span>
        </NavbarItem>
        <Button route="auth.login" outline>
          {t('nav.signIn')}
        </Button>
        <ThemeToggle />
        <LanguageToggle />
      </NavbarSection>
      <NavbarItem
        aria-label={tPlain('nav.openNavigation')}
        className="md:hidden"
        onClick={() => setShowSidebar(true)}
      >
        <OpenMenuIcon />
      </NavbarItem>
      <MobileSidebar open={showSidebar} close={() => setShowSidebar(false)}>
        <Sidebar aria-label={tPlain('nav.sidebar')}>
          <SidebarBody>
            <SidebarSection>
              <SidebarItem route="home" current={page.url === '/'}>
                <SidebarLabel>{t('nav.about')}</SidebarLabel>
              </SidebarItem>
              <SidebarItem route="discover.apps" current={page.url.startsWith('/apps')}>
                <SidebarLabel>{t('nav.apps')}</SidebarLabel>
              </SidebarItem>
              <SidebarItem href={links.privacy} target="_blank" as={'a'}>
                <SidebarLabel>
                  {t('nav.privacy')}
                  <NewTab />
                </SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>
          <SidebarFooter>
            <Button route="auth.login" className="w-full">
              {t('nav.signIn')}
            </Button>
            <div className="mt-2 flex justify-end gap-2">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </SidebarFooter>
        </Sidebar>
      </MobileSidebar>
    </Navbar>
  )
}
