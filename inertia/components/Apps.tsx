import { Data } from '@generated/data'
import { AppGrid } from '~/components/AppGrid'
import { useT } from '~/lib/i18n'

export function Apps({ sections }: { sections: Data.Apps['sections'] }) {
  const { t } = useT()
  const headingStyle = 'mt-8 mb-4 text-lg font-semibold text-neutral-400 dark:text-slate-400'

  return (
    <>
      {sections.map(
        (section) =>
          section.apps.length > 0 && (
            <div key={section.category}>
              <h3 className={headingStyle}>{t(section.category)}</h3>
              <AppGrid apps={section.apps} />
            </div>
          )
      )}
    </>
  )
}
