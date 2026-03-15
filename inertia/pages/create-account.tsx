import { Form } from '@adonisjs/inertia/react'
import { Button } from '~/lib/button'
import Card from '~/lib/card'
import { Checkbox, CheckboxField } from '~/lib/checkbox'
import { Container } from '~/lib/container'
import { Label } from '~/lib/fieldset'
import { Heading } from '~/lib/heading'
import { Text } from '~/lib/text'

export default function CreateAccount() {
  return (
    <Container>
      <Card className="mt-10 w-1/2 m-auto">
        <Heading level={1}>Create a Eurosky Account</Heading>
        <Form className="mt-6" route="oauth.signup">
          {({ errors }) => (
            <div className="flex flex-col gap-2">
              <div className="inline-block">
                <CheckboxField>
                  <Checkbox color="amber" name="terms" value="1" />
                  <Label>I accept the Eurosky Terms of Service and Privacy Policy</Label>
                </CheckboxField>
              </div>
              {errors.terms && <Text className="text-orange-500!">{errors.terms}</Text>}
              <div className="self-end">
                <Button type="submit" color="amber">
                  Continue
                </Button>
              </div>
            </div>
          )}
        </Form>
      </Card>
    </Container>
  )
}
