import './css/app.css'
import { ReactElement } from 'react'
import { client } from './client'
import Layout from '~/layouts/default'
import { Data } from '@generated/data'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

import.meta.glob(['../resources/images/og-image.png'])

const appName = import.meta.env.VITE_APP_NAME || 'Eurosky'

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob('./pages/**/*.tsx'),
      (page: ReactElement<Data.SharedProps>) => <Layout children={page} />
    )
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <TuyauProvider client={client}>
        <App {...props} />
      </TuyauProvider>
    )
  },
  progress: {
    delay: 200,
    color: '#1a1a1a',
  },
})
