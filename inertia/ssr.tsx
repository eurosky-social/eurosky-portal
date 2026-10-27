import { client } from '~/client'
import { ReactElement } from 'react'
import Layout from '~/layouts/default'
import { Data } from '@generated/data'
import ReactDOMServer from 'react-dom/server'
import type { Page, SharedPageProps } from '@inertiajs/core'
import { createInertiaApp, ResolvedComponent } from '@inertiajs/react'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { brand } from '#shared/brand'
import { I18nProvider, loadMessages } from '~/lib/i18n'
import { MotionConfig } from 'motion/react'

export default async function render(page: Page<SharedPageProps>) {
  const { locale } = page.props
  const messages = await loadMessages(locale)

  return createInertiaApp({
    title: (title) => (title ? `${title} - ${brand.productTitle}` : brand.productTitle),
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      return resolvePageComponent(
        `./pages/${name}.tsx`,
        import.meta.glob<{ default: ResolvedComponent }>('./pages/**/*.tsx', { eager: true }),
        (page: ReactElement<Data.SharedProps>) => <Layout children={page} />
      ).then((module) => module.default)
    },
    setup: ({ App, props }) => {
      return (
        <TuyauProvider client={client}>
          <I18nProvider locale={locale} messages={messages}>
            <MotionConfig reducedMotion="user">
              <App {...props} />
            </MotionConfig>
          </I18nProvider>
        </TuyauProvider>
      )
    },
  })
}
