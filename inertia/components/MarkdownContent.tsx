import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { ReactNode } from 'react'
import * as components from './RichTextComponents'
import { Text } from '~/lib/text'
import { useMarkdown } from '~/utils/use_markdown'

/**
 * Render markdown; parsed off the main thread, with a loading skeleton.
 */
export function MarkdownContent({ value }: { value?: string | undefined }): ReactNode {
  const result = useMarkdown(value)

  switch (result.type) {
    case 'error':
      return <Text className="italic">This content couldn’t be displayed.</Text>
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
        return toJsxRuntime(result.tree, {
          Fragment,
          components,
          jsxs,
          jsx,
          passNode: true,
        })
      }
  }
}
