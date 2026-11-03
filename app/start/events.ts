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
import AuthFlowCompleted from '#events/auth_flow_completed'
import AuthFlowStarted from '#events/auth_flow_started'
import AuthLoggedOut from '#events/auth_logged_out'
import PageViewed from '#events/page_viewed'
import TermsAccepted from '#events/terms_accepted'
import WelcomeDismissed from '#events/welcome_dismissed'

emitter.listen(ActivityFeedViewed, [() => import('#listeners/track_activity_feed_viewed')])
emitter.listen(PageViewed, [() => import('#listeners/track_page_viewed')])
emitter.listen(ActivityBackfillStarted, [
  () => import('#listeners/track_activity_backfill_started'),
])
emitter.listen(ActivityBackfillCompleted, [
  () => import('#listeners/track_activity_backfill_completed'),
])
emitter.listen(AuthFlowStarted, [() => import('#listeners/track_auth_flow_started')])
emitter.listen(AuthFlowCompleted, [() => import('#listeners/track_auth_flow_completed')])
emitter.listen(AuthLoggedOut, [() => import('#listeners/track_auth_logged_out')])
emitter.listen(TermsAccepted, [() => import('#listeners/track_terms_accepted')])
emitter.listen(WelcomeDismissed, [() => import('#listeners/track_welcome_dismissed')])
