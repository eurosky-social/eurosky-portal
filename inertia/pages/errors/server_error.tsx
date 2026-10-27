import { Head } from '@inertiajs/react'
import { PageHeader } from '~/components/PageHeader'
import { useT } from '~/lib/i18n'

export default function ServerError() {
  const { tPlain, t } = useT()

  return (
    <>
      <Head title={tPlain('errors.serverError.title')} />
      <PageHeader title={t('errors.serverError.heading')} />
    </>
  )
}
