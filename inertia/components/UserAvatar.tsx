import { Data } from '@generated/data'
import { Avatar } from '~/lib/avatar'

export function UserAvatar({
  user,
}: { user: Data.Profile } & React.ComponentPropsWithoutRef<'div'>) {
  return (
    <Avatar
      className={`relative inline-block w-full h-full bg-amber-100 text-amber-700`}
      src={user.avatar}
      initials={user.handle.slice(0, 2)}
    />
  )
}
