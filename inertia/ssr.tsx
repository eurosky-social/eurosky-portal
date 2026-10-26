import { client } from '~/client'
import { ReactElement } from 'react'
import Layout from '~/layouts/default'
import { Data } from '@generated/data'
import ReactDOMServer from 'react-dom/server'
import type { Page } from '@inertiajs/core'
import { createInertiaApp, ResolvedComponent } from '@inertiajs/react'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { brand } from '#shared/brand'
import { MotionConfig } from 'motion/react'

export default function render(page: Page) {
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
          <MotionConfig reducedMotion="user">
            <App {...props} />
          </MotionConfig>
        </TuyauProvider>
      )
    },
  })
}
