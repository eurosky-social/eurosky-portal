import { Container } from '~/lib/container'
import { Button } from '~/lib/button'
import { Form } from '@adonisjs/inertia/react'

export function Hero() {
  return (
    <Container className="pt-10 pb-16 text-center lg:pt-24">
      <div className="py-1 px-2 mb-6 inline-block rounded-xl bg-amber-100 border-amber-400 border-1 text-yellow-800">
        Now open · Join the future of the web
      </div>
      <h1 className="mx-auto max-w-4xl font-display text-5xl leading-[1.3] font-extrabold tracking-tight text-slate-900 dark:text-slate-200 sm:text-7xl">
        Eurosky: Your Portal to <div className="text-amber-400">the Atmosphere.</div>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 dark:text-gray-400 font-bold">
        One account. Dozens of apps. No lock-in.
      </p>
      <div className="mt-6 flex justify-center gap-x-6 text-2xl">
        <Button route="account.create" color="amber">
          Create your account →
        </Button>
        <Button route="auth.login" outline>
          Login
        </Button>
      </div>
      <div className="mt-4 text-lg text-gray-400">Your data is yours. We will never sell it.</div>
    </Container>
  )
}
