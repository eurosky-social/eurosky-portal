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

export default function Onboarding(
  props: InertiaProps<{
    termsUpdated: boolean
    privacyUpdated: boolean
    legalDocuments: Data.LegalDocuments
  }>
) {
  return (
    <div className="bg-neutral-50 dark:bg-slate-900 min-h-dvh-minus-35">
      <Head title="Accept terms & conditions" />
      <Container className="pt-10 md:pt-24">
        <Card className="w-full md:w-1/2 m-auto p-4 mb-6">
          <h1 className="mx-auto max-w-4xl mb-2 text-center font-display text-3xl leading-[1.2] font-extrabold tracking-tight text-slate-900 dark:text-slate-200 sm:text-5xl">
            Welcome to <span className="text-brand">Eurosky.</span>
          </h1>
          {renderNotice(props.termsUpdated, props.privacyUpdated)}
          <PolicyForm
            route="account.store_acceptance"
            terms={props.legalDocuments.terms}
            privacy={props.legalDocuments.privacy}
          />
          {(props.termsUpdated || props.privacyUpdated) && (
            <Text className="text-center">
              Alternatively, you can{' '}
              <Form route="oauth.logout" className="inline-flex">
                <Button type="submit" link>
                  Logout
                </Button>
              </Form>{' '}
              and not use Eurosky Portal.
            </Text>
          )}
        </Card>
      </Container>
    </div>
  )
}

function renderNotice(termsUpdated: boolean, privacyUpdated: boolean) {
  if (!termsUpdated && !privacyUpdated) {
    return
  }

  let title = `Our Terms of service and Privacy policy have been updated`
  if (termsUpdated && !privacyUpdated) {
    title = `Our Terms of service has been updated`
  }
  if (privacyUpdated && !termsUpdated) {
    title = `Our Privacy policy has been updated`
  }

  return <Notice title={title} text="Please accept the changes to continue using Eurosky Portal" />
}
