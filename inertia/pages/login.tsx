import { Form } from '@adonisjs/inertia/react'
import { Container } from '~/lib/container'
import { Button } from '~/lib/button'
import { ErrorMessage, Field, FieldGroup, Label } from '~/lib/fieldset'
import { Input } from '~/lib/input'
import { Text, TextLink } from '~/lib/text'
import Card from '~/lib/card'
import { InertiaProps } from '~/types'
import { Head, usePage } from '@inertiajs/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid'
import { useT } from '~/lib/i18n'

export default function Login({ migrationUrl }: InertiaProps<{ migrationUrl?: string }>) {
  const { props: pageProps } = usePage()
  const { tPlain, t } = useT()
  return (
    <div className="bg-neutral-50 dark:bg-slate-900 min-h-dvh-minus-35">
      <Head title={tPlain('nav.signIn')} />
      <Container className="pt-10 md:pt-24">
        {pageProps.flash.error && (
          <Card className="w-full md:w-3/4 lg:w-1/2 m-auto px-4 py-2 mb-8 bg-gray-500! dark:bg-slate-600! text-white!">
            <div className="flex flex-row gap-2 items-center-safe">
              <div className="h-8 w-8">
                <ExclamationTriangleIcon color="white" />
              </div>
              <span>{pageProps.flash.error}</span>
            </div>
          </Card>
        )}
        <Card className="w-full md:w-3/4 lg:w-1/2 m-auto p-4 mb-8">
          <h1 className="mx-auto max-w-4xl mb-2 text-center font-display text-3xl leading-[1.2] font-extrabold tracking-tight text-slate-900 dark:text-slate-200 sm:text-5xl">
            {t('login.title', {
              brand(chunks) {
                return <span className="text-brand">{chunks}</span>
              },
            })}
          </h1>
          <Text className="text-center">{t('login.subtitle')}</Text>
          <Form className="my-6" route="oauth.login">
            {({ errors, valid, isDirty, processing }) => (
              <FieldGroup>
                <Field>
                  <Label htmlFor="input">{t('login.handleLabel')}</Label>
                  <Input
                    id="input"
                    name="input"
                    type="input"
                    placeholder="sebastian.eurosky.social"
                    // Input fields turn into `old_$field` on output.
                    // See `createFieldError` in `app/utils/errors.ts`.
                    defaultValue={
                      ('old_input' in errors &&
                        typeof errors.old_input === 'string' &&
                        errors.old_input) ||
                      ''
                    }
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="off"
                  />
                  {errors?.input && (
                    <ErrorMessage className="text-orange-500!">{errors.input}</ErrorMessage>
                  )}
                </Field>
                <Field className="mt-2 flex justify-end justify-items-stretch">
                  <Button
                    type="submit"
                    color={!valid || !isDirty || processing ? 'zinc' : 'brand'}
                    className="w-full py-3! disabled:cursor-default"
                    disabled={!valid || !isDirty || processing}
                  >
                    {t('login.continue')}
                  </Button>
                </Field>
              </FieldGroup>
            )}
          </Form>
          <Text className="text-center">
            {t('login.noAccount', {
              signUp(chunks) {
                return <TextLink route="account.create">{chunks}</TextLink>
              },
            })}
          </Text>
        </Card>
        {migrationUrl && (
          <Card
            as="a"
            href={migrationUrl}
            className="w-full md:w-3/4 lg:w-1/2 m-auto p-4 bg-black! text-white! dark:bg-brand! dark:text-black! flex flex-row gap-4"
          >
            <h1 className="mb-2 text-2xl/9 font-medium">{t('login.migration.heading')}</h1>
            <div className="flex items-center">
              <Button
                as="span"
                color="brand"
                className="text-black! dark:bg-black dark:text-white! text-nowrap"
              >
                {t('login.migration.cta')}
              </Button>
            </div>
          </Card>
        )}
      </Container>
    </div>
  )
}
