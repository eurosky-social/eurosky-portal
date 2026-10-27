import './css/app.css'
import { ReactElement } from 'react'
import { client } from './client'
import Layout from '~/layouts/default'
import { Data } from '@generated/data'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { createInertiaApp, ResolvedComponent } from '@inertiajs/react'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { I18nProvider, loadMessages } from '~/lib/i18n'
import en from '~/lib/i18n/en'
import { brand } from '#shared/brand'
import { MotionConfig } from 'motion/react'
import { focusOnNavigate } from '~/utils/focus_on_navigate'

import.meta.glob(['../resources/images/og-image.png', './images/**'], { eager: true })

createInertiaApp({
  title: (title) => (title ? `${title} - ${brand.productTitle}` : brand.productTitle),
  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob<{ default: ResolvedComponent }>('./pages/**/*.tsx'),
      (page: ReactElement<Data.SharedProps>) => <Layout children={page} />
    ).then((module) => module.default)
  },
  setup({ el, App, props }) {
    const { locale } = props.initialPage.props
    focusOnNavigate()

    loadMessages(locale)
      // Use English if there were unknown problems.
      .catch(() => en)
      .then(function (messages) {
        const app = (
          <TuyauProvider client={client}>
            <I18nProvider locale={locale} messages={messages}>
              <MotionConfig reducedMotion="user">
                <App {...props} />
              </MotionConfig>
            </I18nProvider>
          </TuyauProvider>
        )

        // Some pages are rendered on the server (see `config/inertia.ts`).
        if (el.hasChildNodes()) {
          hydrateRoot(el, app)
        } else {
          createRoot(el).render(app)
        }
      })
  },
  progress: {
    delay: 200,
    color: '#1a1a1a',
  },
})
