import { Data } from '@generated/data'
import { Avatar } from '~/lib/avatar'

export function UserAvatar({
  avatar,
  handle,
}: {
  avatar: Data.Profile['avatar']
  handle: Data.Account['handle']
} & React.ComponentPropsWithoutRef<'div'>) {
  return (
    <Avatar
      className={`relative inline-block w-full h-full bg-amber-100 text-amber-700`}
      src={avatar}
      initials={handle?.slice(0, 2)}
    />
  )
}
