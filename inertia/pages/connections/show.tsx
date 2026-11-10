import { Form } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import type { Oauth2Connection } from '#services/oauth2_service'
import type { Jsonify } from '#shared/json'
import { PageHeader } from '~/components/PageHeader'
import { Button } from '~/lib/button'
import Card from '~/lib/card'
import { useT } from '~/lib/i18n'
import { Text } from '~/lib/text'
import type { InertiaProps } from '~/types'

/**
 * Properties.
 */
interface Properties {
  /**
   * Service to connect, on its own site, if any.
   */
  connect: Service | undefined

  /**
   * Connected services.
   */
  connections: Array<Oauth2Connection>
}

interface Service {
  name: string
  url: string
}

/**
 * Render the services a person connected, with a way to disconnect them.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Element.
 */
export default function ConnectionsPage(properties: InertiaProps<Jsonify<Properties>>) {
  const { connect, connections } = properties
  const { t, tPlain } = useT()

  return (
    <>
      <Head title={tPlain('connections.title')} />
      <div className="space-y-6">
        <PageHeader description={t('connections.subtitle')} title={t('connections.title')} />
        {connections.length === 0 && !connect ? <Text>{t('connections.none')}</Text> : undefined}
        {connections.length === 0 ? undefined : (
          <ul className="space-y-4">
            {connections.map((connection) => (
              <li key={connection.clientId}>
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-semibold text-ink dark:text-white">{connection.name}</p>
                    <Text>{t('connections.since', { date: new Date(connection.createdAt) })}</Text>
                  </div>
                  <Form route="connections.destroy" routeParams={{ clientId: connection.clientId }}>
                    {({ processing }) => (
                      <Button disabled={processing} outline type="submit">
                        {t('connections.disconnect')}
                      </Button>
                    )}
                  </Form>
                </Card>
              </li>
            ))}
          </ul>
        )}
        {connect ? (
          <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
            <p className="font-semibold text-ink dark:text-white">{connect.name}</p>
            <Button as="a" href={connect.url}>
              {t('connections.connect', { name: connect.name })}
            </Button>
          </Card>
        ) : undefined}
      </div>
    </>
  )
}
