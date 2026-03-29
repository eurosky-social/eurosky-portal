import { Container } from '~/lib/container'
import { Button } from '~/lib/button'
import { LockClosedIcon } from '@heroicons/react/24/solid'

export function Hero() {
  return (
    <div className="bg-neutral-50 dark:bg-slate-800">
      <Container className="pt-6 md:pt-10 pb-12 mb-6 text-center lg:pt-24">
        <div className="py-1 px-4 mt-4 mb-8 md:mb-6 md:inline-block rounded-xl bg-neutral-200/60 border-neutral-300/40 border text-neutral-500/60 dark:bg-slate-600 dark:border-slate-700 dark:text-slate-300 uppercase font-bold">
          <span className="flex flex-col md:flex-row gap-x-2 justify-center-safe">
            <span>
              Now open<span className="inline md:hidden">!</span>
            </span>
            <span className="hidden md:inline">&middot;</span>
            <span>Join the future of the web</span>
          </span>
        </div>

        <h1 className="mx-auto max-w-4xl font-display text-3xl sm:text-6xl lg:text-5xl leading-[1.3] font-extrabold tracking-tight text-slate-900 dark:text-slate-200">
          Eurosky: Your Portal to <div className="text-brand">the Atmosphere.</div>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 dark:text-slate-400 font-bold">
          One account. Dozens of apps. No lock-in.
        </p>
        <div className="my-6 flex justify-center gap-4 md:gap-6 text-2xl flex-col md:flex-row">
          <Button route="account.create" className="py-3! px-6!" color="brand">
            Create your account →
          </Button>
          <Button route="auth.login" className="py-3! px-6!" outline>
            Sign in
          </Button>
        </div>
        <div className="mt-6 text-lg text-gray-400 dark:text-slate-400 flex justify-center items-center gap-2">
          <LockClosedIcon className="h-6 w-6 inline-block" />
          <span>Your data is yours. We will never sell it.</span>
        </div>
      </Container>
    </div>
  )
}
