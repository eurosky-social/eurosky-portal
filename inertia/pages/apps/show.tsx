import { Data } from '@generated/data'
import { Head } from '@inertiajs/react'
import { Apps } from '~/components/Apps'
import Card from '~/lib/card'
import { InertiaProps } from '~/types'

export default function ApplicationsPage({
  apps,
}: InertiaProps<{
  apps: {
    gettingStarted: Data.App[]
    exploreMore: Data.App[]
    forWork: Data.App[]
  }
}>) {
  return (
    <Card className="py-3 px-4">
      <Head title="Applications" />
      <h2 className="mt-2 mb-4 text-lg/8 sm:text-3xl/8 font-semibold text-gray-900 dark:text-gray-200">
        Applications
      </h2>
      <p className="mb-4 text-sm/6 text-gray-500 dark:text-gray-300">
        Browse featured apps that work with your Eurosky account.
      </p>
      <Apps apps={apps} />
    </Card>
  )
}
