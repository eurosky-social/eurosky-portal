import type { ReactNode } from 'react'
import type { EmbedRecord } from '#utils/embed'

export function EmbedRecord({ children, embed }: { children: ReactNode; embed: EmbedRecord }) {
  return (
    <div className="space-y-3">
      {children}
      <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
        {/* Just display the `at://` uri for now. */}
        <p className="font-mono text-xs break-all text-zinc-500 dark:text-zinc-400">{embed.uri}</p>
      </div>
    </div>
  )
}
