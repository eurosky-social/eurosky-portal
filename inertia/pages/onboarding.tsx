import { PolicyForm } from '~/components/PolicyForm'
import Card from '~/lib/card'
import { Container } from '~/lib/container'
import { InertiaProps } from '~/types'
import { Data } from '@generated/data'
import { Head } from '@inertiajs/react'
import Notice from '~/lib/notice'
import { Form } from '@adonisjs/inertia/react'
import { Button } from '~/lib/button'
import { Text } from '~/lib/text'
import { useT } from '~/lib/i18n'

export default function Onboarding(
  props: InertiaProps<{
    termsUpdated: boolean
    privacyUpdated: boolean
    legalDocuments: Data.LegalDocuments
  }>
) {
  const { tPlain, t } = useT()

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-dvh-minus-35">
      <Head title={tPlain('onboarding.pageTitle')} />
      <Container className="pt-10 md:pt-24">
        <Card bleed className="w-full md:w-1/2 m-auto p-4 mb-6">
          <h1 className="mx-auto max-w-4xl mb-2 text-center text-3xl leading-[1.08] font-bold tracking-tight text-balance text-ink dark:text-white sm:text-5xl">
            {t('onboarding.title')}
          </h1>
          <UpdateNotice termsUpdated={props.termsUpdated} privacyUpdated={props.privacyUpdated} />
          <PolicyForm
            route="account.store_acceptance"
            terms={props.legalDocuments.terms}
            privacy={props.legalDocuments.privacy}
          />
          {(props.termsUpdated || props.privacyUpdated) && (
            <Text className="text-center">
              {t('onboarding.alternative', {
                logout(chunks) {
                  return (
                    <Form route="oauth.logout" className="inline-flex">
                      <Button type="submit" link>
                        {chunks}
                      </Button>
                    </Form>
                  )
                },
              })}
            </Text>
          )}
        </Card>
      </Container>
    </div>
  )
}

function UpdateNotice({
  termsUpdated,
  privacyUpdated,
}: {
  termsUpdated: boolean
  privacyUpdated: boolean
}) {
  const { tPlain } = useT()
  let title: string | undefined

  if (privacyUpdated && termsUpdated) {
    title = tPlain('onboarding.notice.bothUpdated')
  } else if (privacyUpdated) {
    title = tPlain('onboarding.notice.privacyUpdated')
  } else if (termsUpdated) {
    title = tPlain('onboarding.notice.termsUpdated')
  }

  if (!title) {
    return
  }

  return <Notice title={title} text={tPlain('onboarding.notice.text')} />
}
