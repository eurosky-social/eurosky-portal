import { useCallback } from 'react'
import { UserAvatar } from '~/components/UserAvatar'
import { Button } from '~/lib/button'
import Card from '~/lib/card'
import { Text } from '~/lib/text'
import { InertiaProps } from '~/types'
import { useAuth } from '~/utils/use_auth'
import { Data } from '@generated/data'
import { Apps } from '~/components/Apps'
import { client } from '~/client'
import { useRouter } from '@adonisjs/inertia/react'
import { INVALID_HANDLE } from '@atproto/syntax'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'

export default function Dashboard({
  showWelcomeMessage,
  profile,
  apps,
}: InertiaProps<{
  showWelcomeMessage: boolean
  profile: Data.Profile | undefined
  apps: {
    gettingStarted: Data.App[]
    exploreMore: Data.App[]
    forWork: Data.App[]
  }
}>) {
  const user = useAuth()
  const router = useRouter()
  const isHandleInvalid = user.handle === INVALID_HANDLE

  const dismissWelcome = useCallback(async () => {
    await client.api.account.dismissWelcome({})
    router.visit({ route: 'dashboard.show' }, { only: ['showWelcomeMessage'] })
  }, [])

  return (
    <div className="flex flex-col gap-y-8">
      {isHandleInvalid && (
        <Card className="p-4 bg-amber-500! dark:bg-amber-600/80! flex flex-row gap-2">
          <div className="h-12 w-12">
            <ExclamationTriangleIcon color="white" className="drop-shadow-sm" />
          </div>
          <div>
            <Text className="font-semibold text-white! text-shadow-sm text-shadow-amber-600/80">
              Your handle is currently invalid
            </Text>
            <Text className="text-white! text-shadow-sm text-shadow-amber-600/80">
              It looks like you've attempted to change your handle, and we can't verify it.{' '}
              <a href="#" target="_blank" className="font-semibold hover:underline">
                Learn more
              </a>
            </Text>
          </div>
        </Card>
      )}
      {showWelcomeMessage && (
        <Card className="py-3 px-4 flex flex-col grow md:flex-row items-center justify-between gap-x-6 gap-y-4">
          <div className="flex-1">
            <h2 className="text-lg/8 sm:text-xl/8 font-semibold text-gray-900 dark:text-gray-200 mb-2">
              Welcome to the Atmosphere
            </h2>
            <p className="mt-0.5 text-xs/6 text-gray-500 dark:text-gray-300">
              Eurosky is your European home on the Atmosphere &ndash; a global network of social
              apps and services.
            </p>
            {!isHandleInvalid && (
              <p className="mt-0.5 text-xs/6 text-gray-500 dark:text-gray-300">
                Your handle is{' '}
                <strong className="text-brand-border font-semibold whitespace-pre">
                  {user.handle}
                </strong>
                , you&apos;ll use this to login across the Atmosphere.
              </p>
            )}
          </div>
          <Button
            onClick={dismissWelcome}
            outline
            className="w-full md:w-auto dark:border-slate-600!"
          >
            Dismiss
          </Button>
        </Card>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        <Card className="p-3 md:p-4 col-span-3 md:col-span-2">
          <div className="flex flex-row justify-between">
            <div className="flex flex-row gap-6">
              <div className="size-14 md:size-20 md:self-center">
                <UserAvatar avatar={profile?.avatar} handle={user.handle} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg/8 font-semibold text-zinc-950 sm:text-2xl/8 dark:text-white">
                  {profile?.displayName ?? user.handle}
                </h2>
                {isHandleInvalid ? (
                  <Text className="text-amber-500!">
                    <ExclamationTriangleIcon color="amber" className="h-6 w-6 inline-block" />{' '}
                    {user.handle}
                  </Text>
                ) : (
                  <Text className="text-slate-400!">@{user.handle}</Text>
                )}
                {profile?.stats && (
                  <div className="hidden md:grid grid-cols-1 sm:grid-cols-3">
                    <div className="pr-4 py-2 sm:col-span-1 flex flex-col-reverse">
                      <StatHeading>Posts</StatHeading>
                      <StatValue>{profile.stats.posts ?? 0}</StatValue>
                    </div>
                    <div className="px-4 py-2 sm:col-span-1 sm:px-4 flex flex-col-reverse">
                      <StatHeading>Following</StatHeading>
                      <StatValue>{profile.stats.follows ?? 0}</StatValue>
                    </div>
                    <div className="px-4 py-2 sm:col-span-1 sm:px-4 flex flex-col-reverse">
                      <StatHeading>Followers</StatHeading>
                      <StatValue>{profile.stats.followers ?? 0}</StatValue>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="self-center hidden">
              <Button href="#" outline>
                Edit Profile
              </Button>
            </div>
          </div>
        </Card>

        <Card className="py-3 px-4 col-span-3 md:col-span-1">
          <h2 className="text-lg/8 sm:text-xl/8 font-semibold text-gray-900 dark:text-gray-200 mb-2">
            Explore the ecosystem
          </h2>
          <p className="text-xs/6 text-gray-500 dark:text-gray-300">
            Your Eurosky account works with dozens of apps. Browse the featured apps below and click
            one to get started.
          </p>
          <Button
            route="explore.learn_more"
            color="zinc"
            className="mt-3 w-full sm:w-auto dark:bg-slate-700!"
          >
            Learn more
          </Button>
        </Card>
      </div>
      <div className="pt-4">
        <h2 className="text-xl text-center font-medium text-neutral-500 dark:text-slate-200">
          Featured applications
        </h2>
        <p className="text-center text-base md:textlg text-neutral-400 dark:text-slate-400 mb-6">
          Your Eurosky account works with all of these.
        </p>

        <Apps apps={apps} />
      </div>
    </div>
  )
}

function StatHeading({ children }: React.ComponentPropsWithoutRef<'dt'>) {
  return (
    <span className="text-sm/6 font-medium text-slate-500 dark:text-slate-400">{children}</span>
  )
}

function StatValue({ children }: React.ComponentPropsWithoutRef<'dd'>) {
  return (
    <div className="mt-1 text-sm/6 font-extrabold sm:mt-2 text-gray-900 dark:text-white">
      {children}
    </div>
  )
}
