import type WelcomeDismissed from '#events/welcome_dismissed'
import plausibleService from '#services/plausible_service'

export default class TrackWelcomeDismissed {
  async handle(event: WelcomeDismissed): Promise<undefined> {
    await plausibleService.track('Welcome dismissed', {
      ip: event.ip,
      userAgent: event.userAgent,
    })
  }
}
