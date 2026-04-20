import { Link } from '~/lib/link'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '~/lib/navbar'
import { Logo } from './Logo'
import { Form } from '@adonisjs/inertia/react'
import { Button } from '~/lib/button'
import { useAuth } from '~/utils/use_auth'
import { ThemeToggle } from './ThemeToggle'
import clsx from 'clsx'
import { INVALID_HANDLE } from '@atproto/syntax'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'

export default function DashboardNavbar({ className }: React.ComponentProps<'div'>) {
  const user = useAuth()
  const isHandleInvalid = user.handle === INVALID_HANDLE

  return (
    <Navbar className={clsx(className, 'dark:bg-slate-800/70')}>
      <Link route="dashboard.show" aria-label="Home" className="rounded-sm md:ml-6 mt-1 mb-2">
        <Logo />
      </Link>
      <NavbarSpacer />
      <NavbarSection>
        <NavbarItem route="dashboard.show" className="hidden md:flex">
          {isHandleInvalid ? (
            <span className="text-base/6! sm:text-sm/6! text-amber-500 dark:text-amber-400!">
              <ExclamationTriangleIcon color="amber" className="h-6 w-6 inline-block" />{' '}
              {user.handle}
            </span>
          ) : (
            <span className="text-base/6! text-zinc-500! sm:text-sm/6! dark:text-slate-400!">
              @{user.handle}
            </span>
          )}
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
