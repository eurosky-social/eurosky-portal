import type { HttpContext } from '@adonisjs/core/http'
import activityService from '#services/activity_service'
import { type BskyAppPost, type BskyAppProfile, BskyAppService } from '#services/bsky_app_service'
import ActivityTransformer from '#transformers/activity_transformer'
import { activityDetailValidator, activityQueryValidator } from '#validators/activity'

export default class ActivityController {
  #bskyApp = new BskyAppService()

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

  async detail({ auth, inertia, request, response }: HttpContext) {
    const { did } = await auth.getUserOrFail()

    const validated = await request.validateUsing(activityDetailValidator).catch(() => undefined)
    if (!validated) return response.notFound()
    const { collection, rkey } = validated.params

    const record = await activityService.getRecord(did, collection, rkey)
    if (!record) return response.notFound()
    const { pds, uri, value } = record
    const activity = new ActivityTransformer(value, { did, pds, uri }).toObject()
    let post: BskyAppPost | undefined
    let profile: BskyAppProfile | undefined

    // Fetch what was liked and followed on detail pages.
    if (activity.$type === 'app.bsky.feed.like') {
      post = await this.#bskyApp.getPost(activity.openUri)
    } else if (activity.$type === 'app.bsky.graph.follow') {
      profile = await this.#bskyApp.getProfile(activity.subject)
    }

    return inertia.render('activity/detail', { activity, post, profile })
  }
}
