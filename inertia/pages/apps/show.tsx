import { Data } from '@generated/data'
import { Head } from '@inertiajs/react'
import { Apps } from '~/components/Apps'
import Card from '~/lib/card'
import { InertiaProps } from '~/types'
import { useT } from '~/lib/i18n'

export default function ApplicationsPage({
  favorites,
  sections,
}: InertiaProps<Data.Apps & { favorites: Array<string> | undefined }>) {
  const { tPlain, t } = useT()

  return (
    <Card className="p-4 sm:p-8">
      <Head title={tPlain('sidebar.applications')} />
      <h1 className="mt-2 mb-4 text-lg/8 sm:text-3xl/8 font-semibold text-gray-900 dark:text-gray-200">
        {t('sidebar.applications')}
      </h1>
      <p className="mb-4 text-sm/6 text-gray-500 dark:text-gray-300">{t('apps.subheading')}</p>
      <Apps favorites={favorites} sections={sections} />
    </Card>
  )
}
