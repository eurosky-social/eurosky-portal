import { Head } from '@inertiajs/react'
import { PageHeader } from '~/components/PageHeader'
import { useT } from '~/lib/i18n'

export default function NotFound() {
  const { tPlain, t } = useT()

  return (
    <>
      <Head title={tPlain('errors.notFound.title')} />
      <PageHeader title={t('errors.notFound.title')} />
    </>
  )
}
