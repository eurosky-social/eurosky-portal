import { Link } from '~/lib/link'
import { Navbar, NavbarSection, NavbarSpacer } from '~/lib/navbar'
import { Logo } from './Logo'
import { Form } from '@adonisjs/inertia/react'
import { Button } from '~/lib/button'
import { LanguageToggle } from './LanguageToggle'
import { ThemeToggle } from './ThemeToggle'
import clsx from 'clsx'
import { useT } from '~/lib/i18n'

interface Properties {
  /**
   * Whether to show actions (default: `true`);
   * Renders logout, theme, and language.
   * Turn off when there is no space (and display them somewhere else).
   */
  actions?: boolean

  /**
   * Class name.
   */
  className?: string
}

export default function DashboardNavbar(properties: Properties) {
  const { actions = true, className } = properties
  const { tPlain, t } = useT()

  return (
    <Navbar aria-label={tPlain('nav.main')} className={clsx(className, 'dark:bg-neutral-900')}>
      <Link
        route="dashboard.show"
        aria-label={tPlain('nav.home')}
        className="rounded-sm md:ml-6 mt-1 mb-2"
      >
        <Logo />
      </Link>
      <NavbarSpacer />
      {actions ? (
        <NavbarSection>
          <Form route="oauth.logout" className="flex justify-stretch max-sm:hidden">
            <Button type="submit" outline>
              {t('nav.logout')}
            </Button>
          </Form>
          <ThemeToggle />
          <LanguageToggle />
        </NavbarSection>
      ) : undefined}
    </Navbar>
  )
}
