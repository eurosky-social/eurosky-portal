import { Head } from '@inertiajs/react'
import MarkdownDocument from '~/components/MarkdownDocument'
import Card from '~/lib/card'
import { Container } from '~/lib/container'
import { InertiaProps } from '~/types'

export default function Legal(props: InertiaProps<{ document: string; title: string }>) {
  return (
    <div className="bg-neutral-50 dark:bg-slate-900 py-10 md:pt-24">
      <Head title={props.title} />
      <Container>
        <Card className="w-full md:w-3/4 m-auto p-4">
          <MarkdownDocument document={props.document} />
        </Card>
      </Container>
    </div>
  )
}
