import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { ReactNode } from 'react'
import * as components from './RichTextComponents'
import { Text } from '~/lib/text'
import { useMarkdown } from '~/utils/use_markdown'
import { useT } from '~/lib/i18n'

/**
 * Render markdown; parsed off the main thread, with a loading skeleton.
 */
export function MarkdownContent({ value }: { value?: string | undefined }): ReactNode {
  const result = useMarkdown(value)
  const { t } = useT()

  switch (result.type) {
    case 'error':
      return <Text className="italic">{t('markdown.error')}</Text>
    case 'loading':
      return (
        <div aria-hidden="true" className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      )
    case 'ready':
      if (result.tree) {
        return (
          // User generated content or 3rd party content.
          <div lang="en">
            {toJsxRuntime(result.tree, {
              Fragment,
              components,
              jsxs,
              jsx,
              passNode: true,
            })}
          </div>
        )
      }
  }
}
