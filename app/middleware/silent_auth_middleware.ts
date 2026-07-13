import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Monocle } from '@monocle.sh/adonisjs-agent'
import logger from '@adonisjs/core/services/logger'
import Account from '#models/account'
import jetstreamService from '#services/jetstream_service'

/**
 * Silent auth middleware can be used as a global middleware to silent check
 * if the user is logged-in or not.
 *
 * The request continues as usual, even when the user is not logged-in.
 */
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.check()

    if (ctx.auth.user) {
      const { did } = ctx.auth.user

      Monocle.setUser({ did, id: did })

      // Any request is proof this account is not dormant.
      jetstreamService.addDid(did)
      Account.query()
        .where('did', did)
        .update({ lastActiveAt: DateTime.now().toSQL() })
        .catch((err: unknown) => {
          logger.warn({ did, err }, 'auth: cannot mark account active')
        })
    }

    return next()
  }
}
