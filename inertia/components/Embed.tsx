import { NoSymbolIcon } from '@heroicons/react/24/outline'
import type { BskyAppPost } from '#services/bsky_app_service'
import type { Embed } from '#utils/embed'
import { EmbedExternal } from '~/components/embed/EmbedExternal'
import { EmbedImages } from '~/components/embed/EmbedImages'
import { EmbedRecord } from '~/components/embed/EmbedRecord'

export function Embed({
  embed,
  quotedPost,
}: {
  embed: Embed
  quotedPost?: BskyAppPost | undefined
}) {
  switch (embed.type) {
    case 'external':
      return <EmbedExternal embed={embed} />
    case 'images':
      return <EmbedImages embed={embed} />
    case 'record':
      return <EmbedRecord embed={embed} quotedPost={quotedPost} />
    default:
      return (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-300 p-4 text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          <NoSymbolIcon aria-hidden="true" className="size-6 shrink-0" />
          <p className="text-sm">Could not display this embed</p>
        </div>
      )
  }
}
