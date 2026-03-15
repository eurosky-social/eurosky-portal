import { Link } from '~/lib/link'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '~/lib/navbar'
import { Logo } from './Logo'
import ThemeToggle from './ThemeToggle'

export default function PublicNavbar() {
  return (
    <Navbar className="px-4">
      <Link route="home" aria-label="Home">
        <Logo className="size-10 sm:size-8" />
      </Link>
      <NavbarSpacer />
      <NavbarSection>
        <NavbarItem href="#" current>
          About
        </NavbarItem>
        <NavbarItem href="#apps">Apps</NavbarItem>
        <NavbarItem href="#">Privacy</NavbarItem>
        <ThemeToggle />
      </NavbarSection>
    </Navbar>
  )
}
