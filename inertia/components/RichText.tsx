import type { Root } from 'hast'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import type { AppBskyFeedPostDetail } from '#transformers/activity_transformer'
import * as components from './RichTextComponents'

export function RichText({ text }: { text: AppBskyFeedPostDetail['text'] }) {
  const root: Root = { type: 'root', children: text }

  return (
    <div className="whitespace-pre-wrap text-base text-neutral-900 dark:text-white">
      {toJsxRuntime(root, { Fragment, components, jsxs, jsx, passNode: true })}
    </div>
  )
}
