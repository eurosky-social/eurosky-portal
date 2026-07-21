import { ArrowTurnLeftUpIcon } from '@heroicons/react/24/solid'
import type { BskyAppPost } from '#services/bsky_app_service'
import type { EmbedRecord } from '#utils/embed'
import { Embed } from '../Embed'
import { UserName } from '~/components/UserName'

export function EmbedRecord({
  embed,
  quotedPost,
}: {
  embed: EmbedRecord
  quotedPost?: BskyAppPost | undefined
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <ArrowTurnLeftUpIcon aria-hidden="true" className="size-2.5 shrink-0 inline-block" />{' '}
        Quoting <UserName user={quotedPost?.author} />
      </p>
      {embed.media ? <Embed embed={embed.media} /> : null}
    </div>
  )
}
