import type { External } from '#utils/embed'
import { BlobImage } from '~/components/BlobImage'

export function EmbedExternal({ embed }: { embed: External }) {
  // Note: not actually linking.
  return (
    <div className="grid gap-2 grid-cols-2 xl:grid-cols-3">
      <div className="block w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        {embed.thumbnail ? (
          <BlobImage alt="" blob={embed.thumbnail} className="h-40 w-full object-cover" />
        ) : undefined}
        <div className="p-3">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">{embed.title}</p>
          {embed.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
              {embed.description}
            </p>
          ) : undefined}
          <p className="mt-1 truncate text-xs text-zinc-400 dark:text-zinc-500">{embed.uri}</p>
        </div>
      </div>
    </div>
  )
}
