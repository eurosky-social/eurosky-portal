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
    onboarding: typeof routes['account.onboarding']
    storeAcceptance: typeof routes['account.store_acceptance']
  }
  auth: {
    login: typeof routes['auth.login']
  }
  dashboard: {
    show: typeof routes['dashboard.show']
  }
  legal: {
    show: typeof routes['legal.show']
  }
}
