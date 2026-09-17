import { Head } from '@inertiajs/react'
import { useT } from '~/lib/i18n'

export default function ServerError() {
  const { tPlain, t } = useT()

  return (
    <>
      <Head title={tPlain('errors.serverError.title')} />
      <h1>{t('errors.serverError.heading')}</h1>
    </>
  )
}
