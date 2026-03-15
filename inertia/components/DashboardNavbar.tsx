import { Link } from '~/lib/link'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '~/lib/navbar'
import { Logo } from './Logo'
import { Form } from '@adonisjs/inertia/react'
import { Avatar } from '~/lib/avatar'
import { Button } from '~/lib/button'
import { Text } from '~/lib/text'
import { useAuth } from '~/utils/use_auth'
import { Dropdown, DropdownButton, DropdownMenu } from '~/lib/dropdown'

export default function PublicNavbar() {
  const user = useAuth()

  return (
    <Navbar className="px-4">
      <Link route="home" aria-label="Home">
        <Logo className="size-10 sm:size-8" />
      </Link>
      <NavbarSpacer />
      <NavbarSection>
        <Dropdown>
          <DropdownButton as={NavbarItem} aria-label="Account menu">
            <Text>@{user.handle}</Text>
            <Avatar src={user.avatar} initials={user.handle.slice(0, 2)} className="size-10" />
          </DropdownButton>
          <DropdownMenu className="min-w-40" anchor="bottom end">
            <Form route="oauth.logout" className="col-span-full min-w-40 flex justify-stretch">
              <Button type="submit" plain className="grow text-left">
                Logout
              </Button>
            </Form>
          </DropdownMenu>
        </Dropdown>
      </NavbarSection>
    </Navbar>
  )
}
