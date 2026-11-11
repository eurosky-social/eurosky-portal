import { Form } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import type { Jsonify } from '#shared/json'
import { Button } from '~/lib/button'
import Card from '~/lib/card'
import { Container } from '~/lib/container'
import { useT } from '~/lib/i18n'
import { Text } from '~/lib/text'
import type { InertiaProps } from '~/types'

/**
 * Properties.
 */
interface ClientProperties {
  /**
   * Name of the service asking.
   */
  clientName: string

  /**
   * Handle (or DID) of the account to connect.
   */
  handle: string
}

interface ErrorProperties {
  /**
   * Request cannot be shown.
   */
  error: 'invalidClient'
}

/**
 * Render the page where people agree to connect a service.
 *
 * @param properties
 *   Properties.
 * @returns
 *   Element.
 */
export default function AuthorizePage(
  properties: InertiaProps<Jsonify<ClientProperties | ErrorProperties>>
) {
  const { t, tPlain } = useT()

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-dvh-minus-35">
      <Head title={tPlain('oauth2.pageTitle')} />
      <Container className="pt-10 md:pt-24">
        <Card bleed className="w-full md:w-1/2 m-auto p-4 mb-6 space-y-4">
          {'error' in properties ? (
            <>
              <h1 className="text-center text-3xl font-bold tracking-tight text-balance text-ink dark:text-white">
                {t('oauth2.invalidTitle')}
              </h1>
              <Text className="text-center">{t('oauth2.invalidText')}</Text>
            </>
          ) : (
            <>
              <h1 className="text-center text-3xl font-bold tracking-tight text-balance text-ink dark:text-white">
                {t('oauth2.title', { name: properties.clientName })}
              </h1>
              <Text>{t('oauth2.account', { handle: properties.handle })}</Text>
              <Text>{t('oauth2.media', { name: properties.clientName })}</Text>
              <Text>{t('oauth2.public')}</Text>
              <Text>{t('oauth2.disconnect')}</Text>
              <div className="flex flex-wrap justify-center gap-4">
                <Form route="oauth2.decide">
                  {({ processing }) => (
                    <>
                      <input name="decision" type="hidden" value="deny" />
                      <Button disabled={processing} outline type="submit">
                        {t('oauth2.deny')}
                      </Button>
                    </>
                  )}
                </Form>
                <Form route="oauth2.decide">
                  {({ processing }) => (
                    <>
                      <input name="decision" type="hidden" value="allow" />
                      <Button disabled={processing} type="submit">
                        {t('oauth2.allow')}
                      </Button>
                    </>
                  )}
                </Form>
              </div>
            </>
          )}
        </Card>
      </Container>
    </div>
  )
}
