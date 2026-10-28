import { Container } from '~/lib/container'
import { Button } from '~/lib/button'
import { LockClosedIcon } from '@heroicons/react/24/solid'
import { useT } from '~/lib/i18n'

export function Hero() {
  const { t } = useT()

  return (
    <div>
      <Container className="pt-6 md:pt-10 pb-12 mb-6 text-center lg:pt-24">
        <div className="mt-4 mb-6 font-mono text-xs uppercase tracking-widest text-charcoal dark:text-neutral-400">
          <span className="flex flex-col md:flex-row gap-x-2 justify-center-safe">
            <span>
              {t('hero.badge.nowOpen')}
              <span className="inline md:hidden">!</span>
            </span>
            <span className="hidden md:inline">&middot;</span>
            <span>{t('hero.badge.joinFuture')}</span>
          </span>
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl md:text-5xl leading-[1.08] font-bold tracking-tight text-balance text-ink dark:text-white">
          {t('hero.title')}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-charcoal dark:text-neutral-400">
          {t('hero.subtitle')}
        </p>
        <div className="my-6 flex justify-center gap-4 md:gap-6 text-2xl flex-col md:flex-row">
          <Button route="account.create">{t('hero.createAccount')}</Button>
          <Button route="auth.login" outline>
            {t('nav.signIn')}
          </Button>
        </div>
        <div className="mt-6 text-base text-charcoal dark:text-neutral-400 flex justify-center items-center gap-2">
          <LockClosedIcon className="h-6 w-6 inline-block" />
          <span>{t('hero.dataPromise')}</span>
        </div>
      </Container>
    </div>
  )
}
