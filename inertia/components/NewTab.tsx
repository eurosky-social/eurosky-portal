import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { useT } from '~/lib/i18n'

interface Properties {
  /**
   * Whether to show the icon (default: `true`).
   */
  icon?: boolean
}

/**
 * Hint that a link opens in a new tab;
 * place it inside the link, after its text.
 */
export function NewTab(properties: Properties) {
  const { icon = true } = properties
  const { t } = useT()

  return (
    <>
      {icon ? (
        <ArrowTopRightOnSquareIcon
          aria-hidden="true"
          className="ml-1 inline-block size-4 shrink-0 align-[-0.125em]"
        />
      ) : undefined}
      <span className="sr-only"> {t('common.opensInNewTab')}</span>
    </>
  )
}
