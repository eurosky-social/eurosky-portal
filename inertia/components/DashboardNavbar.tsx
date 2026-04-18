import { Link } from '~/lib/link'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '~/lib/navbar'
import { Logo } from './Logo'
import { Form } from '@adonisjs/inertia/react'
import { Button } from '~/lib/button'
import { Text } from '~/lib/text'
import { useAuth } from '~/utils/use_auth'
import { ThemeToggle } from './ThemeToggle'
import { UserAvatar } from './UserAvatar'
import clsx from 'clsx'

export default function DashboardNavbar({ className }: React.ComponentProps<'div'>) {
  const user = useAuth()

  return (
    <Navbar className={clsx(className, 'dark:bg-slate-800/70')}>
      <Link route="home" aria-label="Home" className="rounded-sm md:ml-6 mt-1 mb-2">
        <Logo />
      </Link>
      <NavbarSpacer />
      <NavbarSection>
        <NavbarItem className="hidden md:flex pointer-events-none" as={'div'}>
          <Text className="dark:text-slate-400!">@{user.handle}</Text>
        </NavbarItem>

        <Form route="oauth.logout" className="justify-stretch hidden lg:flex">
          <Button type="submit" outline className="dark:text-slate-300!">
            Logout
          </Button>
        </Form>
        <ThemeToggle />
      </NavbarSection>
    </Navbar>
  )
}
