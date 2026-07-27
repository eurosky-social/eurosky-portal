import type PageViewed from '#events/page_viewed'
import plausibleService from '#services/plausible_service'

export default class TrackPageViewed {
  async handle(event: PageViewed): Promise<undefined> {
    await plausibleService.track('pageview', {
      ip: event.ip,
      referrer: event.referrer,
      url: event.url,
      userAgent: event.userAgent,
    })
  }
}
