import type TermsAccepted from '#events/terms_accepted'
import plausibleService from '#services/plausible_service'

export default class TrackTermsAccepted {
  async handle(event: TermsAccepted): Promise<undefined> {
    await plausibleService.track(event.reacceptance ? 'Terms reaccepted' : 'Terms accepted', {
      ip: event.ip,
      userAgent: event.userAgent,
    })
  }
}
