import Card from '~/lib/card'
import { Container } from '~/lib/container'
import { InertiaProps } from '~/types'

export default function Legal(props: InertiaProps<{ document: string }>) {
  return (
    <Container>
      <Card className="my-10 w-3/4 m-auto p-4">
        <div
          className="legal-document p-4 dark:text-slate-200 text-gray-800"
          dangerouslySetInnerHTML={{ __html: props.document }}
        />
      </Card>
    </Container>
  )
}
