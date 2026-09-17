import { Hero } from '~/components/Hero'
import { InertiaProps } from '~/types'
import { Data } from '@generated/data'
import { Container } from '~/lib/container'
import { Apps } from '~/components/Apps'
import { useT } from '~/lib/i18n'

export default function Home({ sections }: InertiaProps<Data.Apps>) {
  const { t } = useT()

  return (
    <>
      <Hero />
      <Container className="pt-8 pb-16 py-4" id="apps">
        <h2 className="text-lg text-neutral-500 dark:text-slate-200 font-bold uppercase text-center">
          {t('home.heading')}
        </h2>
        <p className="text-center text-neutral-400 dark:text-slate-400 mb-12">
          {t('home.subheading')}
        </p>

        <Apps sections={sections} />
      </Container>
    </>
  )
}
