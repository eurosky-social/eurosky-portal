import { Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { ReactElement, useEffect } from 'react'
import { Form, Link } from '@adonisjs/inertia/react'

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
  useEffect(() => {
    toast.dismiss()
  }, [usePage().url])

  if (children.props.flash.error) {
    toast.error(children.props.flash.error)
  }

  return (
    <>
      <header>
        <h1>Eurosky</h1>

        <nav>
          {children.props.isAuthenticated ? (
            <>
              {/* <span>{children.props.user.initials}</span> */}
              <Form route="oauth.logout">
                <button type="submit">Logout</button>
              </Form>
            </>
          ) : (
            <>
              <Link route="account.create">Signup</Link>
              <Form route="oauth.login">
                <button type="submit">Login</button>
              </Form>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <Toaster position="top-center" richColors />
    </>
  )
}
