import './css/app.css'
import { ReactElement } from 'react'
import { client } from './client'
import Layout from '~/layouts/default'
import { Data } from '@generated/data'
import { createRoot } from 'react-dom/client'
import { createInertiaApp, ResolvedComponent } from '@inertiajs/react'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { I18nProvider } from '~/lib/i18n'
import { brand } from '#shared/brand'

import.meta.glob(['../resources/images/og-image.png', './images/**'])

createInertiaApp({
  title: (title) => (title ? `${title} - ${brand.appTitle}` : brand.appTitle),
  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob<{ default: ResolvedComponent }>('./pages/**/*.tsx'),
      (page: ReactElement<Data.SharedProps>) => <Layout children={page} />
    ).then((module) => module.default)
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <TuyauProvider client={client}>
        <I18nProvider>
          <App {...props} />
        </I18nProvider>
      </TuyauProvider>
    )
  },
  progress: {
    delay: 200,
    color: '#1a1a1a',
  },
})
