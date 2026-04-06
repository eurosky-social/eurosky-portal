import { PolicyForm } from '~/components/PolicyForm'
import Card from '~/lib/card'
import { Container } from '~/lib/container'
import { InertiaProps } from '~/types'
import { Data } from '@generated/data'

export default function CreateAccount(
  props: InertiaProps<{
    legalDocuments: Data.LegalDocuments
  }>
) {
  return (
    <div className="bg-neutral-50 dark:bg-slate-900 py-10 md:pt-24">
      <Container>
        <Card className="my-10 w-full md:w-3/4 lg:w-1/2 m-auto p-4">
          <h1 className="mx-auto max-w-4xl mb-2 text-center font-display text-3xl leading-[1.2] font-extrabold tracking-tight text-slate-900 dark:text-slate-200 sm:text-5xl">
            Create Your <div className="text-brand">Eurosky Account.</div>
          </h1>
          <PolicyForm
            route="oauth.signup"
            terms={props.legalDocuments.terms}
            privacyPolicy={props.legalDocuments.privacy}
          />
        </Card>
      </Container>
    </div>
  )
}
