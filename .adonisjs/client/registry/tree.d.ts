/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  oauth: {
    logout: typeof routes['oauth.logout']
    login: typeof routes['oauth.login']
    signup: typeof routes['oauth.signup']
    callback: typeof routes['oauth.callback']
  }
  home: typeof routes['home']
  account: {
    create: typeof routes['account.create']
    dismissWelcome: typeof routes['account.dismiss_welcome']
    onboarding: typeof routes['account.onboarding']
    storeAcceptance: typeof routes['account.store_acceptance']
  }
  auth: {
    login: typeof routes['auth.login']
  }
  activity: {
    show: typeof routes['activity.show']
    detail: typeof routes['activity.detail']
  }
  discover: {
    favorite: typeof routes['discover.favorite']
    unfavorite: typeof routes['discover.unfavorite']
    apps: typeof routes['discover.apps']
    app: typeof routes['discover.app']
  }
  connections: {
    show: typeof routes['connections.show']
    destroy: typeof routes['connections.destroy']
  }
  dashboard: {
    show: typeof routes['dashboard.show']
    apps: typeof routes['dashboard.apps']
  }
  files: {
    show: typeof routes['files.show']
  }
  oauth2: {
    authorize: typeof routes['oauth2.authorize']
    decide: typeof routes['oauth2.decide']
    revoke: typeof routes['oauth2.revoke']
    token: typeof routes['oauth2.token']
  }
  dtp: {
    media: typeof routes['dtp.media']
  }
  healthChecks: {
    live: typeof routes['health_checks.live']
    ready: typeof routes['health_checks.ready']
  }
  explore: {
    learnMore: typeof routes['explore.learn_more']
  }
  faq: {
    show: typeof routes['faq.show']
  }
  legal: {
    show: typeof routes['legal.show']
  }
}
