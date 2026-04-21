import { Form } from '@adonisjs/inertia/react'
import { Container } from '~/lib/container'
import { Button } from '~/lib/button'
import { ErrorMessage, Field, FieldGroup, Label } from '~/lib/fieldset'
import { Input } from '~/lib/input'
import { Text } from '~/lib/text'
import { Link } from '~/lib/link'
import Card from '~/lib/card'
import { InertiaProps } from '~/types'
import { Head, usePage } from '@inertiajs/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid'

export default function Login({ migrationUrl }: InertiaProps<{ migrationUrl?: string }>) {
  const { props: pageProps } = usePage()
  return (
    <div className="bg-neutral-50 dark:bg-slate-900 min-h-dvh-minus-35">
      <Head title="Sign in" />
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
            Sign Into Your <div className="text-brand">Eurosky Account.</div>
          </h1>
          <Text className="text-center">Enter your handle below to login to your account</Text>
          <Form className="my-6" route="oauth.login">
            {({ errors, valid, isDirty, processing }) => (
              <FieldGroup>
                <Field>
                  <Label htmlFor="input">Your Atmosphere handle</Label>
                  <Input
                    id="input"
                    name="input"
                    type="input"
                    placeholder="sebastian.eurosky.social"
                    defaultValue={errors.old_input ?? ''}
                    required
                    autoCapitalize="false"
                    autoCorrect="false"
                    autoComplete="true"
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
                    Continue &rarr;
                  </Button>
                </Field>
              </FieldGroup>
            )}
          </Form>
          <Text className="text-center">
            Don&apos;t have an account?{' '}
            <Link route="account.create" className="text-blue-500 hover:underline">
              Sign up
            </Link>
          </Text>
        </Card>
        {migrationUrl && (
          <Card
            as="a"
            href={migrationUrl}
            className="w-full md:w-3/4 lg:w-1/2 m-auto p-4 bg-black! text-white! dark:bg-brand! dark:text-black! flex flex-row gap-4"
          >
            <h1 className="mb-2 text-2xl/9 font-medium">
              If you're on Bluesky, you can move your account today.
            </h1>
            <div className="flex items-center">
              <Button
                color="brand"
                className="text-black! dark:bg-black dark:text-white! text-nowrap"
              >
                Migrate now
              </Button>
            </div>
          </Card>
        )}
      </Container>
    </div>
  )
}
