import { ChatBubbleLeftIcon } from '@heroicons/react/20/solid'
import type { EmbedRecord } from '#utils/embed'
import { Embed } from '../Embed'

export function EmbedRecord({ embed }: { embed: EmbedRecord }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
        <ChatBubbleLeftIcon aria-hidden="true" className="size-3.5 shrink-0" />
        Quoting a record
      </div>
      {embed.media ? <Embed embed={embed.media} /> : null}
    </div>
  )
}
