import type ActivityFeedViewed from '#events/activity_feed_viewed'
import plausibleService from '#services/plausible_service'

export default class TrackActivityFeedViewed {
  async handle(event: ActivityFeedViewed): Promise<undefined> {
    await plausibleService.track('Activity feed viewed', {
      interactive: false,
      ip: event.ip,
      properties: { state: event.state },
      userAgent: event.userAgent,
    })
  }
}
