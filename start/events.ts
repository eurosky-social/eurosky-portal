/*
|--------------------------------------------------------------------------
| Event listeners
|--------------------------------------------------------------------------
|
| This file is used to register event listeners.
|
*/

import emitter from '@adonisjs/core/services/emitter'
import ActivityBackfillCompleted from '#events/activity_backfill_completed'
import ActivityBackfillStarted from '#events/activity_backfill_started'
import ActivityFeedViewed from '#events/activity_feed_viewed'
import PageViewed from '#events/page_viewed'

emitter.listen(ActivityFeedViewed, [() => import('#listeners/track_activity_feed_viewed')])
emitter.listen(PageViewed, [() => import('#listeners/track_page_viewed')])
emitter.listen(ActivityBackfillStarted, [
  () => import('#listeners/track_activity_backfill_started'),
])
emitter.listen(ActivityBackfillCompleted, [
  () => import('#listeners/track_activity_backfill_completed'),
])
