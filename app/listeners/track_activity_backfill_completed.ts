import type ActivityBackfillCompleted from '#events/activity_backfill_completed'
import plausibleService from '#services/plausible_service'

/**
 * Upper bound in milliseconds for each duration bucket, checked in order.
 * Plausible does not do distinct counts so we need to bucket them.
 */
const buckets: Array<[milliseconds: number, label: string]> = [
  [1_000, '<1s'],
  [5_000, '1-5s'],
  [15_000, '5-15s'],
  [60_000, '15-60s'],
  [90_000, '1-1.5m'],
  [120_000, '1.5-2m'],
  [180_000, '2-3m'],
  [300_000, '3-5m'],
]
const bucketUpper = '>5m'

export default class TrackActivityBackfillCompleted {
  async handle(event: ActivityBackfillCompleted): Promise<undefined> {
    const bucket = buckets.find(([limit]) => event.durationMs < limit)
    const duration = bucket ? bucket[1] : bucketUpper

    await plausibleService.track('Activity backfill completed', {
      interactive: false,
      ip: event.ip,
      properties: { duration, outcome: event.outcome },
      userAgent: event.userAgent,
    })
  }
}
