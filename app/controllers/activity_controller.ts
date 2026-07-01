import type { HttpContext } from '@adonisjs/core/http'
import activityService from '#services/activity_service'
import { activityQueryValidator } from '#validators/activity'

export default class ActivityController {
  async show({ auth, inertia, request }: HttpContext) {
    const { did } = await auth.getUserOrFail()
    const { limit, snapshot } = await request.validateUsing(activityQueryValidator)
    const result = await activityService.getRecords({ did, limit, snapshot })

    if (result.state === 'syncing') {
      return inertia.render('activity/show', { state: inertia.always(result.state) })
    }

    // `snapshot`/`state`/`total` must stay fresh.
    const props = {
      activities: result.activities,
      snapshot: inertia.always(result.snapshot),
      state: inertia.always(result.state),
      total: inertia.always(result.total),
    }
    return inertia.render('activity/show', props)
  }
}
