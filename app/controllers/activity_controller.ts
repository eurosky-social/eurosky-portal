import type { HttpContext } from '@adonisjs/core/http'
import activityService from '#services/activity_service'
import { type BskyAppPost, type BskyAppProfile, BskyAppService } from '#services/bsky_app_service'
import {
  type ActivityDetail,
  default as ActivityTransformer,
} from '#transformers/activity_transformer'
import { activityDetailValidator, activityQueryValidator } from '#validators/activity'

type Related = {
  post?: BskyAppPost | undefined
  profile?: BskyAppProfile | undefined
  quotedPost?: BskyAppPost | undefined
}

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
    const related = await this.#fetchRelated(activity)
    return inertia.render('activity/detail', { activity, ...related })
  }

  // Fetch what is interacted with.
  async #fetchRelated(activity: ActivityDetail): Promise<Related> {
    switch (activity.$type) {
      case 'app.bsky.feed.like': {
        const post = await this.#bskyApp.getPost(activity.openUri)
        return { post }
      }
      case 'app.bsky.feed.post': {
        const [post, quotedPost] = await Promise.all([
          activity.replyUri ? this.#bskyApp.getPost(activity.replyUri) : undefined,
          activity.embed?.type === 'record' ? this.#bskyApp.getPost(activity.embed.uri) : undefined,
        ])
        return { post, quotedPost }
      }
      case 'app.bsky.graph.follow': {
        const profile = await this.#bskyApp.getProfile(activity.subject)
        return { profile }
      }
      default:
        return {}
    }
  }
}
