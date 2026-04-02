import { Form } from '@adonisjs/inertia/react'
import { Container } from '~/lib/container'
import { Button } from '~/lib/button'
import { ErrorMessage, Field, FieldGroup, Label } from '~/lib/fieldset'
import { Input } from '~/lib/input'
import { Text } from '~/lib/text'
import { Link } from '~/lib/link'
import Card from '~/lib/card'

export default function Login() {
  return (
    <Container>
      <Card className="mt-10 md:mt-24 w-full md:w-3/4 lg:w-1/2 m-auto p-4">
        <h1 className="mx-auto max-w-4xl mb-2 text-center font-display text-3xl leading-[1.2] font-extrabold tracking-tight text-slate-900 dark:text-slate-200 sm:text-5xl">
          Sign Into Your <div className="text-brand">Eurosky Account.</div>
        </h1>
        <Text className="text-center">
          Enter your handle, Eurosky username, or DID below to login to your account
        </Text>
        <Form className="mt-6" route="oauth.login">
          {({ errors, valid, isDirty }) => (
            <FieldGroup>
              <Field>
                <Label htmlFor="input">Your identity</Label>
                <Input
                  id="input"
                  name="input"
                  type="input"
                  placeholder="sebastian.eurosky.social, sebastian, or did:plc:1234…"
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
                  color={!valid || !isDirty ? 'zinc' : 'brand'}
                  className="w-full py-3! disabled:cursor-default"
                  disabled={!valid || !isDirty}
                >
                  Continue &rarr;
                </Button>
              </Field>
              <Text className="text-center">
                Don&apos;t have an account?{' '}
                <Link route="account.create" className="text-blue-500 hover:underline">
                  Sign up
                </Link>
              </Text>
            </FieldGroup>
          )}
        </Form>
      </Card>
    </Container>
  )
}

;<Form route="oauth.login">
  <Button outline type="submit">
    Sign In
  </Button>
</Form>
