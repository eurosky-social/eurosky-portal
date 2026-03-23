import { Hero } from '~/components/Hero'
import { InertiaProps } from '~/types'
import { Data } from '@generated/data'
import Card, { ClickableCard } from '~/lib/card'
import { Avatar } from '~/lib/avatar'
import { Heading } from '~/lib/heading'
import { Text } from '~/lib/text'
import { Container } from '~/lib/container'
import { PlusIcon } from '@heroicons/react/24/solid'

export default function Home({
  apps,
}: InertiaProps<{
  apps: Data.App[]
}>) {
  return (
    <>
      <Hero />
      <Container>
        <h2 className="text-lg text-gray-400 dark:text-gray-400 font-bold uppercase text-center">
          An app for everything
        </h2>
        <ul
          role="list"
          className="my-4 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4"
        >
          {apps.map((app) => (
            <li key={app.id} className="col-span-1 flex rounded-md shadow-xs dark:shadow-none">
              <ClickableCard
                href={app.url}
                target="_blank"
                className="w-full focus:outline-hidden p-4"
              >
                <Avatar
                  square
                  src={app.icon.path}
                  className={`size-12 mb-2 bg-${app.icon.fallback.color}-400 text-white`}
                  initials={app.icon.fallback.initials}
                />
                <Heading level={4} className="text-base!">
                  {app.name}
                </Heading>
                <Text>{app.summary}</Text>
              </ClickableCard>
            </li>
          ))}
          <li key="more" className="col-span-1 flex rounded-md shadow-xs dark:shadow-none">
            <Card className="w-full focus:outline-hidden p-4 items-center flex flex-col outline-offset-0! outline-2! outline-dashed outline-gray-300 dark:outline-white/20 shadow-none!">
              <PlusIcon className="size-12 p-2 mb-2 text-slate-400" />
              <Heading level={4} className="text-base!">
                More coming
              </Heading>
              <Text className="text-center">There's always new apps being created!</Text>
            </Card>
          </li>
        </ul>
      </Container>
    </>
  )
}
