import logger from '@adonisjs/core/services/logger'
import { exponentialBackoff, Job } from '@adonisjs/queue'
import type { DidString } from '@atproto/lex'
import ActivityBackfillCompleted from '#events/activity_backfill_completed'
import ActivityBackfillStarted from '#events/activity_backfill_started'
import activityService from '#services/activity_service'

interface Options {
  did: DidString
  ip: string
  userAgent?: string | undefined
}

export default class BackfillJob extends Job<Options> {
  static options = {
    retry: { backoff: exponentialBackoff(), maxRetries: 2 },
  }

  #start = 0

  async execute(): Promise<undefined> {
    const { did, ip, userAgent } = this.payload

    // Only start for first attempt.
    if (this.context.attempt === 1) {
      ActivityBackfillStarted.dispatch({ ip, userAgent }).catch((err: unknown) => {
        logger.warn({ err }, 'plausible: cannot track backfill start event')
      })
    }

    this.#start = Date.now()
    await activityService.backfill(did)

    ActivityBackfillCompleted.dispatch({
      durationMs: Date.now() - this.#start,
      ip,
      outcome: 'success',
      userAgent,
    }).catch((err: unknown) => {
      logger.warn({ err }, 'plausible: cannot track backfill compelted success event')
    })
  }

  async failed(err: Error): Promise<undefined> {
    const { did, ip, userAgent } = this.payload
    logger.warn({ did, err }, 'activity: cannot backfill user')

    ActivityBackfillCompleted.dispatch({
      durationMs: Date.now() - this.#start,
      ip,
      outcome: 'error',
      userAgent,
    }).catch((error: unknown) => {
      logger.warn({ err: error }, 'plausible: cannot track backfill completed error event')
    })
  }
}
