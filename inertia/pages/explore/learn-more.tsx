import { Head } from '@inertiajs/react'
import MarkdownDocument from '~/components/MarkdownDocument'
import { PageHeader } from '~/components/PageHeader'
import { InertiaProps } from '~/types'
import { useT } from '~/lib/i18n'

export default function Dashboard({
  document,
}: InertiaProps<{
  document: string
}>) {
  const { tPlain, t } = useT()

  return (
    <>
      <Head title={tPlain('dashboard.explore.heading')} />
      <PageHeader className="mb-8" title={t('dashboard.explore.heading')} />
      <MarkdownDocument document={document} />
    </>
  )
}
