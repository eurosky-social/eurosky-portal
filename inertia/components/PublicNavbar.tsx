import { Link } from '~/lib/link'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '~/lib/navbar'
import { Logo } from './Logo'
import { LanguageToggle } from './LanguageToggle'
import { ThemeToggle } from './ThemeToggle'
import { Button } from '~/lib/button'
import { usePage } from '@inertiajs/react'
import { urlFor } from '~/client'
import { useT } from '~/lib/i18n'

export default function PublicNavbar() {
  const page = usePage()
  const { tPlain, t } = useT()

  return (
    <Navbar className="gap-2! md:gap-4! md:px-6 px-3 bg-neutral-50 dark:bg-slate-800 sticky top-0 z-50">
      <Link route="home" aria-label={tPlain('nav.home')} className="pb-3 mt-1">
        <Logo />
      </Link>
      <NavbarSpacer />
      <NavbarSection>
        <NavbarItem route="home" current={page.url === '/'}>
          {t('nav.about')}
        </NavbarItem>
        <NavbarItem href={`${urlFor('home')}#apps`} current={page.url === '/#apps'}>
          {t('nav.apps')}
        </NavbarItem>
        <NavbarItem href="https://eurosky.tech/accounts/privacy/" target="_blank">
          {t('nav.privacy')}
        </NavbarItem>
        <Button route="auth.login" outline className="hidden! md:inline-flex!">
          {t('nav.signIn')}
        </Button>
        <ThemeToggle className="hidden! md:inline-flex!" />
        <LanguageToggle className="hidden! md:inline-flex!" />
      </NavbarSection>
    </Navbar>
  )
}
