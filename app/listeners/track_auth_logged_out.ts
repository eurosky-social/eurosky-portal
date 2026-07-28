import type AuthLoggedOut from '#events/auth_logged_out'
import plausibleService from '#services/plausible_service'

export default class TrackAuthLoggedOut {
  async handle(event: AuthLoggedOut): Promise<undefined> {
    await plausibleService.track('Logged out', {
      ip: event.ip,
      userAgent: event.userAgent,
    })
  }
}
