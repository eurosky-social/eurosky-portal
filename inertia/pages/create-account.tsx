import { PolicyForm } from '~/components/PolicyForm'
import Card from '~/lib/card'
import { Text } from '~/lib/text'
import { Container } from '~/lib/container'
import { InertiaProps } from '~/types'
import { Data } from '@generated/data'
import { Head, usePage } from '@inertiajs/react'
import { Link } from '~/lib/link'
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid'

export default function CreateAccount(
  props: InertiaProps<{
    legalDocuments: Data.LegalDocuments
  }>
) {
  const { props: pageProps } = usePage()
  return (
    <div className="bg-neutral-50 dark:bg-slate-900 min-h-dvh-minus-35">
      <Head title="Create account" />
      <Container className="py-10 md:pt-24">
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
        <Card className="my-10 w-full md:w-3/4 lg:w-1/2 m-auto p-4">
          <h1 className="mx-auto max-w-4xl mb-2 text-center font-display text-3xl leading-[1.2] font-extrabold tracking-tight text-slate-900 dark:text-slate-200 sm:text-5xl">
            Create Your <div className="text-brand">Eurosky Account.</div>
          </h1>
          <Text className="text-center text-slate-600">
            Before we get started, please review and accept our terms.
          </Text>
          <PolicyForm
            route="oauth.signup"
            terms={props.legalDocuments.terms}
            privacy={props.legalDocuments.privacy}
          />
          <Text className="text-center">
            Already have an account?{' '}
            <Link route="auth.login" className="text-blue-500 hover:underline">
              Sign in
            </Link>
          </Text>
        </Card>
      </Container>
    </div>
  )
}
