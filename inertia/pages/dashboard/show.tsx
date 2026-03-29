import clsx from 'clsx'
import { ReactNode, useState } from 'react'
import { UserAvatar } from '~/components/UserAvatar'
import { Button } from '~/lib/button'
import Card from '~/lib/card'
import { Heading } from '~/lib/heading'
import { Text } from '~/lib/text'
import { InertiaProps } from '~/types'
import { useAuth } from '~/utils/use_auth'
import { Data } from '@generated/data'
import { Apps } from '~/components/Apps'

export default function Dashboard({
  apps,
}: InertiaProps<{
  apps: {
    gettingStarted: Data.App[]
    exploreMore: Data.App[]
    forWork: Data.App[]
  }
}>) {
  const user = useAuth()
  const [showIntro, setShowIntro] = useState(localStorage.hide_intro !== 'true')
  const hideIntro = () => {
    localStorage.setItem('hide_intro', 'true')
    setShowIntro(false)
  }
  return (
    <>
      <Card className="p-3 md:p-4 mb-8">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-6">
            <div className="size-14 md:size-20 md:self-center">
              <UserAvatar user={user} />
            </div>
            <div className="flex flex-col">
              <Heading level={2}>{user.displayName ?? user.handle}</Heading>
              <Text className="text-slate-400!">@{user.handle}</Text>
              <dl className="hidden md:grid grid-cols-1 sm:grid-cols-3">
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
          <div className="self-center hidden">
            <Button href="#" outline>
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>
      {showIntro && (
        <Card className="mt-4">
          <ul role="list" className="divide-y divide-gray-100 dark:divide-white/5">
            <ActionItem
              heading="Welcome to the Atmosphere"
              highlight={true}
              action={
                <Button
                  onClick={hideIntro}
                  outline
                  className="w-full md:w-auto dark:border-slate-600!"
                >
                  Dismiss
                </Button>
              }
            >
              Eurosky is your European home on the Atmosphere &ndash; a global network of social
              apps and services &ndash; here's what's next.
            </ActionItem>
            <ActionItem heading="Your account is ready">
              <span className="white-space-collapse">
                You've joined the Atmosphere with Eurosky.
                <span className="block visible md:hidden pb-2"></span> Your handle is{' '}
                <strong className="text-brand-border font-bold whitespace-pre">
                  @{user.handle}
                </strong>
                {'. '}
                Don't forget to verify your email.
              </span>
            </ActionItem>
            <ActionItem heading="Own your identity">
              You can move your handle to any domain you control. You can even move your whole
              account out of Eurosky and keep all you data and connections.
            </ActionItem>
            <ActionItem heading="Explore the ecosystem">
              Your Eurosky account works with dozens of apps. Browse the featured apps below and
              click one to get started.
            </ActionItem>
          </ul>
        </Card>
      )}
      <h2 className="text-xl text-center mt-8 font-medium text-neutral-500 dark:text-slate-200">
        Featured applications
      </h2>
      <p className="text-center text-base md:textlg text-neutral-400 dark:text-slate-400 mb-6">
        Your Eurosky account works with all of these.
      </p>

      <Apps apps={apps} />
    </>
  )
}

function StatHeading({ children }: React.ComponentPropsWithoutRef<'dt'>) {
  return <dt className="text-sm/6 font-medium text-slate-500 dark:text-slate-400">{children}</dt>
}

function StatValue({ children }: React.ComponentPropsWithoutRef<'dd'>) {
  return (
    <dd className="mt-1 text-sm/6 font-extrabold sm:mt-2 text-gray-900 dark:text-white">
      {children}
    </dd>
  )
}

function ActionItem({
  heading,
  action,
  highlight,
  className,
  children,
}: {
  heading: string | ReactNode
  action?: ReactNode
  highlight?: Boolean
} & React.ComponentPropsWithoutRef<'div'>) {
  return (
    <li
      className={clsx(
        className,
        // highlight
        //   ? 'bg-neutral-200/40 rounded-t-lg border border-neutral-300/60 dark:border-slate-800 dark:bg-slate-700/40'
        //   : '',
        'flex flex-col md:flex-row items-center justify-between gap-x-6 gap-y-4 py-3 px-4'
      )}
    >
      <div className="flex flex-col grow">
        <div
          className={clsx(
            'text-sm/6 font-semibold flex items-center',
            highlight ? 'text-gray-900 dark:text-gray-200' : 'text-gray-900 dark:text-gray-200'
          )}
        >
          {heading}
        </div>
        <div
          className={clsx(
            'mt-0.5 flex flex-row justify-between text-xs/6',
            highlight ? 'text-gray-500 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {children}
        </div>
      </div>
      {action}
    </li>
  )
}
