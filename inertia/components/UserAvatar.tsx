import { Data } from '@generated/data'
import { Avatar } from '~/lib/avatar'

export function UserAvatar({ user }: { user: Data.Profile }) {
  return (
    <Avatar
      className={`relative inline-block size-20 self-center bg-amber-100 text-amber-700`}
      src={user.avatar}
      initials={user.handle.slice(0, 2)}
    />
  )
}
