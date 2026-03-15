import { Avatar } from '~/lib/avatar'
import { Button } from '~/lib/button'
import Card from '~/lib/card'
import { Heading } from '~/lib/heading'
import { Text } from '~/lib/text'
import { InertiaProps } from '~/types'
import { useAuth } from '~/utils/use_auth'

export default function Dashboard({}: InertiaProps<{}>) {
  const user = useAuth()
  return (
    <>
      <Card>
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-6">
            <Avatar className="size-20 self-center" src={user.avatar} />
            <div className="flex flex-col">
              <Heading level={2}>{user.displayName ?? user.handle}</Heading>
              <Text className="text-slate-400!">{user.handle}</Text>
              <dl className="grid grid-cols-1 sm:grid-cols-3">
                <div className="pr-4 py-2 sm:col-span-1 flex flex-col-reverse">
                  <StatHeading>Posts</StatHeading>
                  <StatValue>{user.postsCount ?? 0}</StatValue>
                </div>
                <div className="px-4 py-2 sm:col-span-1 sm:px-4 flex flex-col-reverse">
                  <StatHeading>Following</StatHeading>
                  <StatValue>{user.followsCount ?? 0}</StatValue>
                </div>
                <div className="px-4 py-2 sm:col-span-1 sm:px-4 flex flex-col-reverse">
                  <StatHeading>Followers</StatHeading>
                  <StatValue>{user.followersCount ?? 0}</StatValue>
                </div>
              </dl>
            </div>
          </div>
          <div className="self-center">
            <Button href="#" color="amber">
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>
      <Card className="mt-4">
        <ul role="list" className="divide-y divide-gray-100 dark:divide-white/5">
          <li className="flex items-center justify-between gap-x-6 py-5">
            <div className="min-w-0">
              <div className="flex items-start gap-x-3">
                <p className="text-sm/6 font-semibold text-gray-900 dark:text-white">
                  Some heading
                </p>
              </div>
              <div className="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500 dark:text-gray-400">
                Some Text
              </div>
            </div>
          </li>
        </ul>
      </Card>
    </>
  )
}

function StatHeading({ children }: React.ComponentPropsWithoutRef<'dt'>) {
  return <dt className="text-sm/6 font-medium text-slate-700 dark:text-slate-400">{children}</dt>
}

function StatValue({ children }: React.ComponentPropsWithoutRef<'dd'>) {
  return (
    <dd className="mt-1 text-sm/6 font-extrabold sm:mt-2 text-gray-900 dark:text-white">
      {children}
    </dd>
  )
}
