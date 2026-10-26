import { PolicyForm } from '~/components/PolicyForm'
import Card from '~/lib/card'
import { Text, TextLink } from '~/lib/text'
import { Container } from '~/lib/container'
import { InertiaProps } from '~/types'
import { Data } from '@generated/data'
import { Head } from '@inertiajs/react'
import { useT } from '~/lib/i18n'
import Notice from '~/lib/notice'

export default function CreateAccount(
  props: InertiaProps<{
    legalDocuments: Data.LegalDocuments
    migrationUrl?: string
  }>
) {
  const { tPlain, t } = useT()
  return (
    <div className="bg-neutral-50 dark:bg-slate-900 min-h-dvh-minus-35">
      <Head title={tPlain('createAccount.pageTitle')} />
      <Container className="pt-6 md:pt-12">
        {props.migrationUrl && (
          <div className="w-full md:w-3/4 lg:w-1/2 m-auto">
            <Notice
              action={
                <a
                  href={props.migrationUrl}
                  className="text-brand-strong hover:underline dark:text-brand"
                >
                  {tPlain('migrationAlert.cta')}
                </a>
              }
              text={tPlain('migrationAlert.text')}
              title={tPlain('migrationAlert.title')}
            />
          </div>
        )}
        <Card className="w-full md:w-3/4 lg:w-1/2 m-auto p-4 mb-8">
          <h1 className="mx-auto max-w-4xl mb-2 text-center font-display text-3xl leading-[1.2] font-extrabold tracking-tight text-slate-900 dark:text-slate-200 sm:text-5xl">
            {t('createAccount.title', {
              brand(chunks) {
                return <span className="text-brand-strong dark:text-brand">{chunks}</span>
              },
            })}
          </h1>
          <Text className="text-center text-slate-600">{t('createAccount.subtitle')}</Text>
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
