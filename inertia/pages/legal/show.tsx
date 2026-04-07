import Card from '~/lib/card'
import { Container } from '~/lib/container'
import { InertiaProps } from '~/types'
import { Head } from '@inertiajs/react'

export default function Legal(props: InertiaProps<{ document: string; title: string }>) {
  return (
    <Container>
      <Head title={props.title} />
      <Card className="my-10 w-full md:w-3/4 m-auto p-4">
        <div
          className="legal-document p-4 dark:text-slate-200 text-gray-800"
          dangerouslySetInnerHTML={{ __html: props.document }}
        />
      </Card>
    </Container>
  )
}
