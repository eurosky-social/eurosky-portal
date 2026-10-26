import { Data } from '@generated/data'
import { AppGrid } from '~/components/AppGrid'
import { useT } from '~/lib/i18n'

export function Apps({
  favorites,
  sections,
}: {
  favorites?: ReadonlyArray<string> | undefined
  sections: Data.Apps['sections']
}) {
  const { t } = useT()
  const headingStyle = 'mt-8 mb-4 text-lg font-semibold text-zinc-950 dark:text-white'

  return (
    <>
      {sections.map(
        (section) =>
          section.apps.length > 0 && (
            <div key={section.category}>
              <h3 className={headingStyle}>{t(section.category)}</h3>
              <AppGrid apps={section.apps} favorites={favorites} />
            </div>
          )
      )}
    </>
  )
}
