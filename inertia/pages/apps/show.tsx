import { Data } from '@generated/data'
import { Head } from '@inertiajs/react'
import { Apps } from '~/components/Apps'
import { PageHeader } from '~/components/PageHeader'
import { InertiaProps } from '~/types'
import { useT } from '~/lib/i18n'

export default function ApplicationsPage({
  favorites,
  sections,
}: InertiaProps<Data.Apps & { favorites: Array<string> | undefined }>) {
  const { tPlain, t } = useT()

  return (
    <>
      <Head title={tPlain('sidebar.applications')} />
      <PageHeader
        className="mb-8"
        description={t('apps.subheading')}
        title={t('sidebar.applications')}
      />
      <Apps favorites={favorites} sections={sections} />
    </>
  )
}
