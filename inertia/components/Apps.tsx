import { Data } from '@generated/data'
import { AppGrid } from '~/components/AppGrid'
import { useT } from '~/lib/i18n'

interface Properties {
  /**
   * List of favorite app IDs.
   */
  favorites?: ReadonlyArray<string> | undefined

  /**
   * Rank of category headings (default: `2`).
   */
  level?: 2 | 3

  /**
   * App sections.
   */
  sections: Data.Apps['sections']
}

export function Apps({ favorites, level = 2, sections }: Properties) {
  const { t } = useT()
  const Heading = level === 2 ? 'h2' : 'h3'

  return (
    <>
      {sections.map(
        (section) =>
          section.apps.length > 0 && (
            <div key={section.category}>
              <Heading className="mt-8 mb-4 text-lg font-semibold text-neutral-950 dark:text-white">
                {t(section.category)}
              </Heading>
              <AppGrid apps={section.apps} favorites={favorites} />
            </div>
          )
      )}
    </>
  )
}
