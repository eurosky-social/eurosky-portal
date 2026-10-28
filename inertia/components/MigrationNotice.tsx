import { links, localizeMigration } from '#shared/links'
import { useT } from '~/lib/i18n'
import Notice from '~/lib/notice'
import { NewTab } from './NewTab'

const linkClassName =
  'underline decoration-ink/50 hover:decoration-ink dark:decoration-white/50 dark:hover:decoration-white'

interface Properties {
  /**
   * URL of the migration tool.
   */
  migrationUrl: string
}

/**
 * Notice pointing people with a Bluesky account to the migration tool,
 * before they create a new account.
 */
export function MigrationNotice(properties: Properties) {
  const { migrationUrl } = properties
  const { locale, t, tPlain } = useT()

  return (
    <Notice
      action={
        <a href={localizeMigration(migrationUrl, locale)} className={linkClassName}>
          {tPlain('migrationAlert.cta')}
        </a>
      }
      text={t('migrationAlert.text', {
        link(chunks) {
          return (
            <a
              className={linkClassName}
              href={links.helpCantMigrate(locale)}
              rel="noopener noreferrer"
              target="_blank"
            >
              {chunks}
              <NewTab />
            </a>
          )
        },
      })}
      title={tPlain('migrationAlert.title')}
    />
  )
}
