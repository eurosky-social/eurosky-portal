import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import type { ElementContent, Root } from 'hast'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import type { AppBskyFeedPostDetail } from '#transformers/activity_transformer'
import * as components from './RichTextComponents'

export function RichText({ text }: { text: AppBskyFeedPostDetail['text'] }) {
  // Cast because inertia fails on TS `interface`s.
  const root: Root = { type: 'root', children: text as unknown as Array<ElementContent> }

  return (
    <div className="p-4 whitespace-pre-wrap text-base text-zinc-900 dark:text-white">
      {toJsxRuntime(root, { Fragment, components, jsxs, jsx, passNode: true })}
    </div>
  )
}
