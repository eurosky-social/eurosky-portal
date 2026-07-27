import type ActivityBackfillStarted from '#events/activity_backfill_started'
import plausibleService from '#services/plausible_service'

export default class TrackActivityBackfillStarted {
  async handle(event: ActivityBackfillStarted): Promise<undefined> {
    await plausibleService.track('Activity backfill started', {
      interactive: false,
      ip: event.ip,
      userAgent: event.userAgent,
    })
  }
}
