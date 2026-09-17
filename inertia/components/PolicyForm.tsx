import { Form, FormRouteProps } from '@adonisjs/inertia/react'
import type { ReactNode } from 'react'
import { ChevronDownIcon, DocumentTextIcon, LockClosedIcon } from '@heroicons/react/24/solid'
import { Button } from '~/lib/button'
import { Checkbox, CheckboxField } from '~/lib/checkbox'
import { Label } from '~/lib/fieldset'
import { Link } from '~/lib/link'
import { Text } from '~/lib/text'
import { useForm } from '@inertiajs/react'
import type { routes } from '@generated/registry'
import MarkdownDocument from './MarkdownDocument'
import { useT } from '~/lib/i18n'

type Routes = keyof typeof routes
type PolicyFormProps<Route extends Routes> = {
  terms: string
  privacy: string
} & Pick<FormRouteProps<Route>, 'route'>

export function PolicyForm({ route, terms, privacy }: PolicyFormProps<Routes>) {
  const form = useForm({
    terms: false,
  })
  const { t } = useT()

  return (
    <>
      <div className="flex flex-col my-4 gap-4">
        <PolicyDetails
          header={
            <>
              <DocumentTextIcon className="w-6 h-6 inline-block text-slate-500" />
              {t('sidebar.termsOfService')}
            </>
          }
          document={terms}
        />
        <PolicyDetails
          header={
            <>
              <LockClosedIcon className="w-6 h-6 inline-block text-slate-500" />
              {t('sidebar.privacyPolicy')}
            </>
          }
          document={privacy}
        />
      </div>
      <Form className="my-6" route={route}>
        {({ errors, processing }) => (
          <div className="flex flex-col gap-4">
            <div className="inline-block">
              <CheckboxField>
                <Checkbox
                  color="brand"
                  name="terms"
                  value="1"
                  checked={form.data.terms}
                  onChange={(checked) => form.setData('terms', checked)}
                />
                <Label>
                  {t('policy.accept', {
                    terms(chunks) {
                      return (
                        <Link
                          route="legal.show"
                          routeParams={{ document: 'terms' }}
                          className="text-blue-500 hover:underline"
                        >
                          {chunks}
                        </Link>
                      )
                    },
                    privacy(chunks) {
                      return (
                        <Link
                          route="legal.show"
                          routeParams={{ document: 'privacy' }}
                          className="text-blue-500 hover:underline"
                        >
                          {chunks}
                        </Link>
                      )
                    },
                  })}
                </Label>
              </CheckboxField>
            </div>
            {errors.terms && <Text className="text-orange-500!">{errors.terms}</Text>}
            <Button
              type="submit"
              color={!form.data.terms || processing ? 'zinc' : 'brand'}
              className="mt-2 py-3! disabled:cursor-default"
              disabled={!form.data.terms || processing}
            >
              {t('login.continue')}
            </Button>
          </div>
        )}
      </Form>
    </>
  )
}

function PolicyDetails({ header, document }: { header: ReactNode; document: string }) {
  return (
    <details
      name="policy"
      className="legal-details overflow-auto rounded-lg shadow-xs dark:bg-gray-800/50 border border-slate-200 dark:border-slate-600"
    >
      <summary className="p-4 text-slate-600 dark:text-slate-300 list-none flex flex-row justify-between bg-white dark:bg-gray-800">
        <span className="flex flex-row gap-1">{header}</span>
        <ChevronDownIcon className="details-icon w-6 h-6 flex" />
      </summary>
      <MarkdownDocument className="p-4" document={document} />
    </details>
  )
}
