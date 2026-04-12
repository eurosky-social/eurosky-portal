import MarkdownDocument from '~/components/MarkdownDocument'
import Card from '~/lib/card'
import { InertiaProps } from '~/types'

export default function Dashboard({
  document,
}: InertiaProps<{
  document: string
}>) {
  return (
    <Card className="py-3 px-4">
      <h2 className="text-lg/8 sm:text-xl/8 font-semibold text-gray-900 dark:text-gray-200 mb-2">
        Explore the ecosystem
      </h2>
      <MarkdownDocument document={document} />
    </Card>
  )
}
