import { Head } from '@inertiajs/react'
import { useT } from '~/lib/i18n'

export default function NotFound() {
  const { tPlain, t } = useT()

  return (
    <>
      <Head title={tPlain('errors.notFound.title')} />
      <h1>{t('errors.notFound.title')}</h1>
    </>
  )
}
