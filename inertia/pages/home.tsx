import { Hero } from '~/components/Hero'
import { InertiaProps } from '~/types'

export default function Home({}: InertiaProps<{}>) {
  return (
    <>
      <Hero />
    </>
  )
}
