import type { ReactNode } from 'react'
import type { BskyAppProfile } from '#services/bsky_app_service'

export function UserName({ user }: { user: BskyAppProfile | undefined }): ReactNode {
  const value = user?.displayName || (user?.handle ? '@' + user.handle : undefined) || undefined
  return <span className={value ? 'font-bold' : undefined}>{value || 'someone'}</span>
}
