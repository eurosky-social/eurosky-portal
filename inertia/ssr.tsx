import { client } from '~/client'
import { ReactElement } from 'react'
import Layout from '~/layouts/default'
import { Data } from '@generated/data'
import ReactDOMServer from 'react-dom/server'
import { createInertiaApp } from '@inertiajs/react'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

export default function render(page: any) {
  const appName = page.props.brand
    ? `${page.props.brand.name} Portal`
    : import.meta.env.VITE_APP_NAME || 'Portal'

  return createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      return resolvePageComponent(
        `./pages/${name}.tsx`,
        import.meta.glob('./pages/**/*.tsx', { eager: true }),
        (page: ReactElement<Data.SharedProps>) => <Layout children={page} />
      )
    },
    setup: ({ App, props }) => {
      return (
        <TuyauProvider client={client}>
          <App {...props} />
        </TuyauProvider>
      )
    },
  })
}
