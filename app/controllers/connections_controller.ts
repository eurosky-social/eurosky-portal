import type { HttpContext } from '@adonisjs/core/http'
import oauth2Service from '#services/oauth2_service'
import { connectionValidator } from '#validators/connections'

/**
 * Services a person connected to our OAuth 2.0 server (see
 * `Oauth2Controller`).
 */
export default class ConnectionsController {
  /**
   * Disconnect a service;
   * it then gets `session_invalidated`, which stops its transfers.
   */
  async destroy({ auth, request, response }: HttpContext) {
    const { did } = auth.getUserOrFail()
    if (!oauth2Service.isAllowed(did)) return response.notFound()

    const { params } = await request.validateUsing(connectionValidator)
    await oauth2Service.disconnect(did, params.clientId)
    return response.redirect().toRoute('connections.show')
  }

  async show({ auth, inertia, response }: HttpContext) {
    const { did } = auth.getUserOrFail()
    if (!oauth2Service.isAllowed(did)) return response.notFound()

    const client = oauth2Service.getClient()
    const connections = await oauth2Service.listConnections(did)

    return inertia.render('connections/show', {
      connect:
        client?.connectUrl && !connections.some((d) => d.clientId === client.id)
          ? { name: client.name, url: client.connectUrl }
          : undefined,
      connections,
    })
  }
}
