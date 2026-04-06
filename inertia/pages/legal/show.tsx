import MarkdownDocument from '~/components/MarkdownDocument'
import Card from '~/lib/card'
import { Container } from '~/lib/container'
import { InertiaProps } from '~/types'

export default function Legal(props: InertiaProps<{ document: string }>) {
  return (
    <div className="bg-neutral-50 py-10">
      <Container>
        <Card className="w-full md:w-3/4 m-auto p-4">
          <MarkdownDocument document={props.document} />
        </Card>
      </Container>
    </div>
  )
}
