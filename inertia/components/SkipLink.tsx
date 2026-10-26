import { useT } from '~/lib/i18n'

/**
 * ID of the main content, which `SkipLink` jumps to.
 */
export const mainId = 'main'

/**
 * Link to skip to the main content, visible when focused.
 */
export function SkipLink() {
  const { t } = useT()

  return (
    <a
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-zinc-950 focus:shadow-lg dark:focus:bg-slate-900 dark:focus:text-white"
      href={'#' + mainId}
    >
      {t('nav.skipToContent')}
    </a>
  )
}
