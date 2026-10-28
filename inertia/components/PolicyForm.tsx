import { Form, FormRouteProps } from '@adonisjs/inertia/react'
import { ChevronDownIcon, DocumentTextIcon, LockClosedIcon } from '@heroicons/react/24/solid'
import type { Root } from 'hast'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import type { ReactNode } from 'react'
import type { Jsonify } from '#shared/json'
import { Button } from '~/lib/button'
import { Checkbox, CheckboxField } from '~/lib/checkbox'
import { ErrorMessage, Label } from '~/lib/fieldset'
import { links } from '#shared/links'
import { NewTab } from '~/components/NewTab'
import { useForm } from '@inertiajs/react'
import type { routes } from '@generated/registry'
import { useT } from '~/lib/i18n'

type Routes = keyof typeof routes
type PolicyFormProps<Route extends Routes> = {
  terms: Jsonify<Root>
  privacy: Jsonify<Root>
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
              <DocumentTextIcon className="w-6 h-6 inline-block text-neutral-500" />
              {t('sidebar.termsOfService')}
            </>
          }
          document={terms}
        />
        <PolicyDetails
          header={
            <>
              <LockClosedIcon className="w-6 h-6 inline-block text-neutral-500" />
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
                  aria-invalid={errors.terms ? true : undefined}

                  name="terms"
                  value="1"
                  checked={form.data.terms}
                  onChange={(checked) => form.setData('terms', checked)}
                />
                <Label>
                  {t('policy.accept', {
                    terms(chunks) {
                      return (
                        <a
                          className="underline decoration-ink/50 hover:decoration-ink dark:decoration-white/50 dark:hover:decoration-white"
                          href={links.terms}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {chunks}
                          <NewTab />
                        </a>
                      )
                    },
                    privacy(chunks) {
                      return (
                        <a
                          className="underline decoration-ink/50 hover:decoration-ink dark:decoration-white/50 dark:hover:decoration-white"
                          href={links.privacy}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {chunks}
                          <NewTab />
                        </a>
                      )
                    },
                  })}
                </Label>
                {errors.terms && <ErrorMessage>{errors.terms}</ErrorMessage>}
              </CheckboxField>
            </div>
            <Button type="submit" className="mt-2" disabled={processing}>
              {t('login.continue')}
            </Button>
          </div>
        )}
      </Form>
    </>
  )
}

function PolicyDetails({ header, document }: { header: ReactNode; document: Jsonify<Root> }) {
  return (
    <details
      name="policy"
      className="legal-details overflow-auto rounded-lg shadow-xs dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-600"
    >
      <summary className="p-4 text-neutral-600 dark:text-neutral-300 list-none flex flex-row justify-between bg-white dark:bg-neutral-800">
        <span className="flex flex-row gap-1">{header}</span>
        <ChevronDownIcon className="details-icon w-6 h-6 flex" />
      </summary>
      <div className="markdown-document dark:text-neutral-200 text-grey-800 p-4" lang="en">
        {toJsxRuntime(document, { Fragment, jsx, jsxs })}
      </div>
    </details>
  )
}
