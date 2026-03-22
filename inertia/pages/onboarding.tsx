import { PolicyForm } from '~/components/PolicyForm'
import Card from '~/lib/card'
import { Container } from '~/lib/container'
import { InertiaProps } from '~/types'
import { Data } from '@generated/data'

export default function Onboarding(
  props: InertiaProps<{
    legalDocuments: Data.LegalDocuments
  }>
) {
  return (
    <Container>
      <Card className="mt-10 w-1/2 m-auto p-4 mb-6">
        <h1 className="mx-auto max-w-4xl mb-2 text-center font-display text-3xl leading-[1.2] font-extrabold tracking-tight text-slate-900 dark:text-slate-200 sm:text-5xl">
          Welcome to <div className="text-amber-400">Eurosky.</div>
        </h1>
        <PolicyForm
          route="account.store_acceptance"
          terms={props.legalDocuments.terms}
          privacyPolicy={props.legalDocuments.privacy}
        />
      </Card>
    </Container>
  )
}
