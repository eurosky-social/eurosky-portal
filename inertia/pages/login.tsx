import { Form } from '@adonisjs/inertia/react'
import { Container } from '~/lib/container'
import { Button } from '~/lib/button'
import { Field, FieldGroup, Label } from '~/lib/fieldset'
import { Heading } from '~/lib/heading'
import { Input } from '~/lib/input'
import { Text } from '~/lib/text'

export default function Login() {
  return (
    <Container>
      <Heading level={1}>Login to your account</Heading>
      <Text>Enter your handle below to login to your account</Text>
      <Form route="oauth.login">
        {({ errors }) => (
          <FieldGroup>
            <Field>
              <Label htmlFor="input">Your Internet handle</Label>
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
            </Field>
            <Field>
              <Button type="submit">Login</Button>
              {/* <FieldDescription className="text-center">
                    Don&apos;t have an account? <Link href="/signup">Sign up</Link>
                  </FieldDescription> */}
            </Field>
          </FieldGroup>
        )}
      </Form>
    </Container>
  )
}

;<Form route="oauth.login">
  <Button outline type="submit">
    Sign In
  </Button>
</Form>
