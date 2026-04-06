import { Link } from '~/lib/link'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '~/lib/navbar'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { Button } from '~/lib/button'
import { usePage } from '@inertiajs/react'
import { urlFor } from '~/client'

export default function PublicNavbar() {
  const page = usePage()

  return (
    <Navbar className="gap-2! md:gap-4! md:px-6 px-3 bg-neutral-50 dark:bg-slate-800 sticky top-0 z-50">
      <Link route="home" aria-label="Home" className="pb-3 mt-1">
        <Logo />
      </Link>
      <NavbarSpacer />
      <NavbarSection>
        <NavbarItem route="home" current={page.url === '/'}>
          About
        </NavbarItem>
        <NavbarItem href={`${urlFor('home')}#apps`} current={page.url === '/#apps'}>
          Apps
        </NavbarItem>
        <NavbarItem
          route="legal.show"
          routeParams={{ document: 'privacy' }}
          current={page.url === '/legal/privacy'}
        >
          Privacy
        </NavbarItem>
        <Button route="auth.login" outline className="hidden! md:inline-flex!">
          Sign in
        </Button>
        <ThemeToggle className="hidden! md:inline-flex!" />
      </NavbarSection>
    </Navbar>
  )
}
