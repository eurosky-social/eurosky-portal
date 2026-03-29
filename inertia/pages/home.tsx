import { Hero } from '~/components/Hero'
import { InertiaProps } from '~/types'
import { Data } from '@generated/data'
import { Container } from '~/lib/container'
import { Apps } from '~/components/Apps'

export default function Home({
  apps,
}: InertiaProps<{
  apps: {
    gettingStarted: Data.App[]
    exploreMore: Data.App[]
    forWork: Data.App[]
  }
}>) {
  return (
    <>
      <Hero />
      <Container className="pt-8 pb-16 py-4" id="apps">
        <h2 className="text-lg text-neutral-500 dark:text-slate-200 font-bold uppercase text-center">
          An app for everything
        </h2>
        <p className="text-center text-neutral-400 dark:text-slate-400 mb-12">
          There's always new apps being created!
        </p>

        <Apps apps={apps} />

        {/* <Card className="w-full focus:outline-hidden p-4 items-center flex flex-col outline-offset-0! outline-2! outline-dashed outline-gray-300 dark:outline-white/20 shadow-none!">
          <PlusIcon className="size-12 p-2 mb-2 text-slate-400" />
          <Heading level={4} className="text-base!">
            More coming
          </Heading>
          <Text className="text-center">There's always new apps being created!</Text>
        </Card> */}
      </Container>
    </>
  )
}
