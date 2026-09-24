import logger from '@adonisjs/core/services/logger'
import { exponentialBackoff, Job } from '@adonisjs/queue'
import type { DidString } from '@atproto/lex'
import storageService from '#services/storage_service'

interface Options {
  did: DidString
}

export default class StorageBackfillJob extends Job<Options> {
  static options = {
    retry: { backoff: exponentialBackoff(), maxRetries: 2 },
  }

  async execute(): Promise<undefined> {
    const { did } = this.payload
    await storageService.backfill(did)
  }

  async failed(err: Error): Promise<undefined> {
    const { did } = this.payload
    logger.warn({ did, err }, 'storage: cannot backfill user')
  }
}
