import { Form } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { Container } from '~/lib/container'
import { Button } from '~/lib/button'
import { ErrorMessage, Field, FieldGroup, Label } from '~/lib/fieldset'
import { Input } from '~/lib/input'
import { Text, TextLink } from '~/lib/text'
import { InertiaProps } from '~/types'
import Card from '~/lib/card'
import { useT } from '~/lib/i18n'
import { MigrationNotice } from '~/components/MigrationNotice'
import { NewTab } from '~/components/NewTab'
import { links } from '#shared/links'
import Layout from '~/layouts/default'
import type { ReactElement } from 'react'
import { Data } from '@generated/data'

export default function Login({ migrationUrl }: InertiaProps<{ migrationUrl?: string }>) {
  const { locale, tPlain, t } = useT()
  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-dvh-minus-35">
      <Head title={tPlain('nav.signIn')} />
      <Container className="pt-6 md:pt-12">
        {migrationUrl && (
          <div className="w-full md:w-3/4 lg:w-1/2 m-auto">
            <MigrationNotice migrationUrl={migrationUrl} />
          </div>
        )}
        <Card bleed className="w-full md:w-3/4 lg:w-1/2 m-auto p-4 mb-8">
          <h1 className="mx-auto max-w-4xl mb-2 text-center text-3xl leading-[1.08] font-bold tracking-tight text-balance text-ink dark:text-white sm:text-5xl">
            {t('login.title')}
          </h1>
          <Text className="text-center">{t('login.subtitle')}</Text>
          <Form className="my-6" route="oauth.login">
            {({ errors, processing }) => (
              <FieldGroup>
                <Field>
                  <Label>{t('login.handleLabel')}</Label>
                  <Input
                    invalid={Boolean(errors.input)}
                    name="input"
                    type="text"
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
                    spellCheck={false}
                  />
                  {errors.input && <ErrorMessage>{errors.input}</ErrorMessage>}
                </Field>
                <Field className="mt-2 flex justify-end justify-items-stretch">
                  <Button type="submit" className="w-full" disabled={processing}>
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
          <Text className="text-center">
            {t('login.forgotPassword', {
              link(chunks) {
                return (
                  <a
                    className="text-neutral-950 underline decoration-neutral-950/50 hover:decoration-neutral-950 dark:text-white dark:decoration-white/50 dark:hover:decoration-white"
                    href={links.helpPasswordReset(locale)}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {chunks}
                    <NewTab />
                  </a>
                )
              },
            })}
          </Text>
        </Card>
      </Container>
    </div>
  )
}

Login.layout = (page: ReactElement<Data.SharedProps>) => <Layout bleed>{page}</Layout>
