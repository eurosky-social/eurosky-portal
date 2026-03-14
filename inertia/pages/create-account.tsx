import { Form } from '@adonisjs/inertia/react'

export default function CreateAccount() {
  return (
    <>
      <h1>Create a Eurosky Account</h1>
      <Form route="oauth.signup">
        {({ errors }) => (
          <>
            <div>
              <label>
                <input type="checkbox" value="1" name="terms" required />I accept the Eurosky Terms
                of Service and Privacy Policy
              </label>
              {errors.terms && <div>{errors.terms}</div>}
            </div>
            <div>
              <button type="submit">Continue</button>
            </div>
          </>
        )}
      </Form>
    </>
  )
}
