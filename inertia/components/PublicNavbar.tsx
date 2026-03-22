import { Link } from '~/lib/link'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '~/lib/navbar'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { Button } from '~/lib/button'
import { usePage } from '@inertiajs/react'
import { urlFor } from '~/client'

export default function PublicNavbar() {
  const page = usePage()
  console.log(page.url)

  return (
    <Navbar className="ps-4 pe-8">
      <Link route="home" aria-label="Home">
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
        <Button route="auth.login" outline>
          Sign in
        </Button>
        <ThemeToggle />
      </NavbarSection>
    </Navbar>
  )
}
