import { Head } from '@inertiajs/react'
import MarkdownDocument from '~/components/MarkdownDocument'
import Card from '~/lib/card'
import { InertiaProps } from '~/types'
import { useT } from '~/lib/i18n'

export default function Dashboard({
  document,
}: InertiaProps<{
  document: string
}>) {
  const { tPlain, t } = useT()

  return (
    <Card className="py-3 px-4">
      <Head title={tPlain('dashboard.explore.heading')} />
      <h2 className="mt-2 text-lg/8 sm:text-3xl/8 font-semibold text-gray-900 dark:text-gray-200">
        {t('dashboard.explore.heading')}
      </h2>
      <MarkdownDocument document={document} />
    </Card>
  )
}
