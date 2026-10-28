import { links } from '#shared/links'
import { NewTab } from '~/components/NewTab'
import { useT } from '~/lib/i18n'

export default function BetaWarning() {
  const { t } = useT()

  return (
    <div className="bg-brand py-2 px-3 text-center text-ink text-sm font-medium max-sm:text-sm">
      {t('beta.warning', {
        feedback(chunks) {
          return (
            <a
              href={links.feedback}
              rel="noopener noreferrer"
              target="_blank"
              className="underline hover:text-charcoal"
            >
              {chunks}
              <NewTab />
            </a>
          )
        },
      })}
    </div>
  )
}
