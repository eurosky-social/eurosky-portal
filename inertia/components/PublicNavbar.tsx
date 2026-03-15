import { Link } from '~/lib/link'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '~/lib/navbar'
import { Logo } from './Logo'
import ThemeToggle from './ThemeToggle'

export default function PublicNavbar() {
  return (
    <Navbar className="ps-4 pe-8">
      <Link route="home" aria-label="Home">
        <Logo />
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
