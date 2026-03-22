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

type Routes = keyof typeof routes
type PolicyFormProps<Route extends Routes> = {
  terms: string
  privacyPolicy: string
} & Pick<FormRouteProps<Route>, 'route'>

export function PolicyForm({ route, terms, privacyPolicy }: PolicyFormProps<Routes>) {
  const form = useForm({
    terms: false,
  })

  return (
    <>
      <Text className="text-center text-slate-600">
        Before we get started, please review and accept our terms.
      </Text>
      <div className="flex flex-col my-4 gap-4">
        <PolicyDetails
          header={
            <>
              <DocumentTextIcon className="w-6 h-6 inline-block text-slate-500" />
              Terms of Service
            </>
          }
          document={terms}
        />
        <PolicyDetails
          header={
            <>
              <LockClosedIcon className="w-6 h-6 inline-block text-slate-500" />
              Privacy Policy
            </>
          }
          document={privacyPolicy}
        />
      </div>
      <Form className="mt-6 mb-2" route={route}>
        {({ errors, processing }) => (
          <div className="flex flex-col gap-4">
            <div className="inline-block">
              <CheckboxField>
                <Checkbox
                  color="amber"
                  name="terms"
                  value="1"
                  checked={form.data.terms}
                  onChange={(checked) => form.setData('terms', checked)}
                />
                <Label>
                  I have read and accept the{' '}
                  <Link
                    route="legal.show"
                    routeParams={{ document: 'terms' }}
                    className="text-blue-500 hover:underline"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    route="legal.show"
                    routeParams={{ document: 'privacy' }}
                    className="text-blue-500 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </CheckboxField>
            </div>
            {errors.terms && <Text className="text-orange-500!">{errors.terms}</Text>}
            <Button
              type="submit"
              color={!form.data.terms || processing ? 'zinc' : 'amber'}
              className="mt-2 py-3! disabled:cursor-default"
              disabled={!form.data.terms || processing}
            >
              Continue &rarr;
            </Button>
            {route === 'oauth.signup' && (
              <Text className="text-center">
                Already have an account?{' '}
                <Link route="auth.login" className="text-blue-500 hover:underline">
                  Sign in
                </Link>
              </Text>
            )}
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
      <div
        className="legal-document p-4 dark:text-slate-200 text-gray-800"
        dangerouslySetInnerHTML={{ __html: document }}
      ></div>
    </details>
  )
}
