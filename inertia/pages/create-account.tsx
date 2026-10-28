import { PolicyForm } from '~/components/PolicyForm'
import Card from '~/lib/card'
import { Text, TextLink } from '~/lib/text'
import { Container } from '~/lib/container'
import { InertiaProps } from '~/types'
import { Data } from '@generated/data'
import { Head } from '@inertiajs/react'
import { useT } from '~/lib/i18n'
import { MigrationNotice } from '~/components/MigrationNotice'
import Layout from '~/layouts/default'
import type { ReactElement } from 'react'

export default function CreateAccount(
  props: InertiaProps<{
    legalDocuments: Data.LegalDocuments
    migrationUrl?: string
  }>
) {
  const { tPlain, t } = useT()
  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-dvh-minus-35">
      <Head title={tPlain('createAccount.pageTitle')} />
      <Container className="pt-6 md:pt-12">
        {props.migrationUrl && (
          <div className="w-full md:w-3/4 lg:w-1/2 m-auto">
            <MigrationNotice migrationUrl={props.migrationUrl} />
          </div>
        )}
        <Card bleed className="w-full md:w-3/4 lg:w-1/2 m-auto p-4 mb-8">
          <h1 className="mx-auto max-w-4xl mb-2 text-center text-3xl leading-[1.08] font-bold tracking-tight text-balance text-ink dark:text-white sm:text-5xl">
            {t('createAccount.title')}
          </h1>
          <Text className="text-center text-neutral-600">{t('createAccount.subtitle')}</Text>
          <PolicyForm
            route="oauth.signup"
            terms={props.legalDocuments.terms}
            privacy={props.legalDocuments.privacy}
          />
          <Text className="text-center">
            {t('createAccount.haveAccount', {
              signIn(chunks) {
                return <TextLink route="auth.login">{chunks}</TextLink>
              },
            })}
          </Text>
        </Card>
      </Container>
    </div>
  )
}

CreateAccount.layout = (page: ReactElement<Data.SharedProps>) => <Layout bleed>{page}</Layout>
