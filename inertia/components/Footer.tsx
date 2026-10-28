import clsx from 'clsx'
import { links } from '#shared/links'
import { Container } from '~/lib/container'
import { useT } from '~/lib/i18n'
import { Link } from '~/lib/link'
import { NewTab } from './NewTab'

const linkClassName =
  'text-charcoal hover:text-ink hover:underline dark:text-neutral-400 dark:hover:text-white'

interface Properties {
  /**
   * Whether the content above has its own line on large screens
   * (the panel in `SidebarLayout`);
   * the footer then does not draw one there, which would overlap.
   */
  panelAbove?: boolean
}

/**
 * Footer with support and legal links.
 */
export function Footer(properties: Properties) {
  const { panelAbove } = properties
  const { t, tPlain } = useT()
  const external = [
    { href: links.help, label: t('sidebar.help') },
    { href: links.contact, label: t('sidebar.contactUs') },
    { href: links.terms, label: t('sidebar.termsOfService') },
    { href: links.privacy, label: t('sidebar.privacyPolicy') },
  ]

  return (
    <footer
      className={clsx(
        'border-t border-stone-light dark:border-neutral-800',
        panelAbove && 'lg:border-t-0'
      )}
    >
      <Container>
        <nav aria-label={tPlain('nav.footer')} className="py-8">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <li>
              <Link className={linkClassName} route="faq.show">
                {t('sidebar.faq')}
              </Link>
            </li>
            {external.map(({ href, label }) => (
              <li key={href}>
                <a className={linkClassName} href={href} rel="noopener noreferrer" target="_blank">
                  {label}
                  <NewTab />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  )
}
