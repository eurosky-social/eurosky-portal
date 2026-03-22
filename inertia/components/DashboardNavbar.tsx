import { Link } from '~/lib/link'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '~/lib/navbar'
import { Logo } from './Logo'
import { Form } from '@adonisjs/inertia/react'
import { Button } from '~/lib/button'
import { Text } from '~/lib/text'
import { useAuth } from '~/utils/use_auth'
import { Dropdown, DropdownButton, DropdownMenu } from '~/lib/dropdown'
import { ThemeToggle } from './ThemeToggle'
import { UserAvatar } from './UserAvatar'

export default function DashboardNavbar() {
  const user = useAuth()

  return (
    <Navbar className="px-4">
      <Link route="home" aria-label="Home" className="rounded-sm">
        <Logo />
      </Link>
      <NavbarSpacer />
      <NavbarSection>
        <Dropdown>
          <DropdownButton as={NavbarItem} aria-label="Account menu">
            <Text>@{user.handle}</Text>
            <UserAvatar user={user} />
          </DropdownButton>
          <DropdownMenu className="min-w-40" anchor="bottom end">
            <Form route="oauth.logout" className="col-span-full min-w-40 flex justify-stretch">
              <Button type="submit" plain className="grow text-left">
                Logout
              </Button>
            </Form>
          </DropdownMenu>
        </Dropdown>
        <ThemeToggle />
      </NavbarSection>
    </Navbar>
  )
}
