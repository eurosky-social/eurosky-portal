import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { links } from '#shared/links'
import { NewTab } from '~/components/NewTab'
import Card from '~/lib/card'
import { useT } from '~/lib/i18n'
import { Text } from '~/lib/text'

interface Properties {
  /**
   * What is (not yet) there.
   */
  children: ReactNode
}

/**
 * Render a notice that a page is in development, with a link to give
 * feedback.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Element.
 */
export function UnderConstruction(properties: Properties): ReactNode {
  const { locale, t } = useT()

  return (
    <Card className="p-4 bg-amber-50! dark:bg-amber-400/10! flex flex-row gap-3">
      <TriangleAlert aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-amber-400" />
      <div>
        <Text className="font-semibold text-amber-800! dark:text-amber-200!">
          {t('underConstruction.title')}
        </Text>
        <Text className="text-amber-700! dark:text-amber-200/80!">{properties.children}</Text>
        <Text className="text-amber-700! dark:text-amber-200/80!">
          <a
            className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-100"
            href={links.feedback(locale)}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('beta.giveFeedback')}
            <NewTab />
          </a>
        </Text>
      </div>
    </Card>
  )
}
