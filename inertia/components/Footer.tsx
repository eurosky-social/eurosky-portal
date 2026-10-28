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
 * Footer with support, legal, and organization links, like on eurosky.tech.
 */
export function Footer(properties: Properties) {
  const { panelAbove } = properties
  const { locale, t, tPlain } = useT()
  const sections = [
    {
      title: t('sidebar.support'),
      items: [
        { href: links.help(locale), label: t('sidebar.help') },
        { label: t('sidebar.faq'), route: 'faq.show' as const },
        { href: links.contact(locale), label: t('sidebar.contactUs') },
        { href: links.status(locale), label: t('footer.status') },
      ],
    },
    {
      title: t('footer.legal'),
      items: [
        { href: links.terms(locale), label: t('sidebar.termsOfService') },
        { href: links.privacy(locale), label: t('sidebar.privacyPolicy') },
        { href: links.transparency(locale), label: t('footer.transparency') },
        { href: links.security(locale), label: t('footer.security') },
      ],
    },
    {
      title: t('footer.organization'),
      items: [
        { href: links.about(locale), label: t('footer.about') },
        { href: links.mu(locale), label: 'mu' },
        { href: links.linkedin(locale), label: 'LinkedIn' },
      ],
    },
  ]

  return (
    <footer
      className={clsx(
        'border-t border-stone-light dark:border-neutral-800',
        panelAbove && 'lg:border-t-0'
      )}
    >
      <Container className="py-12">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-[2fr_repeat(3,minmax(0,1fr))]">
          <p className="col-span-2 max-w-xs text-sm/6 text-charcoal sm:col-span-3 lg:col-span-1 dark:text-neutral-400">
            {t('footer.foundation')}
          </p>
          <nav aria-label={tPlain('nav.footer')} className="contents">
            {sections.map(({ items, title }, index) => (
              <div key={index}>
                <h2 className="mb-4 text-sm font-semibold text-ink dark:text-white">{title}</h2>
                <ul className="space-y-2 text-sm">
                  {items.map(({ href, label, route }) => (
                    <li key={href ?? route}>
                      {route ? (
                        <Link className={linkClassName} route={route}>
                          {label}
                        </Link>
                      ) : (
                        <a
                          className={linkClassName}
                          href={href}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {label}
                          <NewTab />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <p className="mt-12 border-t border-stone-light pt-8 text-sm text-charcoal dark:border-neutral-800 dark:text-neutral-400">
          {t('footer.copyright', { year: String(new Date().getFullYear()) })}
        </p>
      </Container>
    </footer>
  )
}
