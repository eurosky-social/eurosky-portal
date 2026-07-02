import { Data } from '@generated/data'
import { AppGrid } from '~/components/AppGrid'

export function Apps({ sections }: { sections: Data.Apps['sections'] }) {
  const headingStyle = 'mt-8 mb-4 text-lg font-semibold text-neutral-400 dark:text-slate-400'

  return (
    <>
      {sections.map(
        (section) =>
          section.apps.length > 0 && (
            <div key={section.category}>
              <h3 className={headingStyle}>{categoryTitle(section.category)}</h3>
              <AppGrid apps={section.apps} />
            </div>
          )
      )}
    </>
  )
}

/**
 * Turn a slug such as `getting-started` into a title such as `Getting started`.
 *
 * Very basic; should be fine for now.
 */
function categoryTitle(value: string): string {
  const words = value.split('-')
  let index = -1

  while (++index < words.length) {
    const word = words[index]
    if (word === 'and') words[index] = '&'
  }

  const title = words.join(' ')
  return title.charAt(0).toUpperCase() + title.slice(1)
}
