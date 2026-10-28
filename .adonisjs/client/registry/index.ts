/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'oauth.logout': {
    methods: ["POST"],
    pattern: '/oauth/logout',
    tokens: [[0,"oauth"],[0,"logout"]],
    types: placeholder as Registry['oauth.logout']['types'],
  },
  'oauth.login': {
    methods: ["POST"],
    pattern: '/oauth/login',
    tokens: [[0,"oauth"],[0,"login"]],
    types: placeholder as Registry['oauth.login']['types'],
  },
  'oauth.signup': {
    methods: ["POST"],
    pattern: '/oauth/signup',
    tokens: [[0,"oauth"],[0,"signup"]],
    types: placeholder as Registry['oauth.signup']['types'],
  },
  'oauth.callback': {
    methods: ["GET","HEAD"],
    pattern: '/oauth/callback',
    tokens: [[0,"oauth"],[0,"callback"]],
    types: placeholder as Registry['oauth.callback']['types'],
  },
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [[0,"/"]],
    types: placeholder as Registry['home']['types'],
  },
  'account.create': {
    methods: ["GET","HEAD"],
    pattern: '/create-account',
    tokens: [[0,"create-account"]],
    types: placeholder as Registry['account.create']['types'],
  },
  'auth.login': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['auth.login']['types'],
  },
  'dashboard.show': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard',
    tokens: [[0,"dashboard"]],
    types: placeholder as Registry['dashboard.show']['types'],
  },
  'dashboard.apps': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard/apps',
    tokens: [[0,"dashboard"],[0,"apps"]],
    types: placeholder as Registry['dashboard.apps']['types'],
  },
  'discover.favorite': {
    methods: ["POST"],
    pattern: '/apps/:rkey/favorite',
    tokens: [[0,"apps"],[1,"rkey"],[0,"favorite"]],
    types: placeholder as Registry['discover.favorite']['types'],
  },
  'discover.unfavorite': {
    methods: ["DELETE"],
    pattern: '/apps/:rkey/favorite',
    tokens: [[0,"apps"],[1,"rkey"],[0,"favorite"]],
    types: placeholder as Registry['discover.unfavorite']['types'],
  },
  'activity.show': {
    methods: ["GET","HEAD"],
    pattern: '/activity',
    tokens: [[0,"activity"]],
    types: placeholder as Registry['activity.show']['types'],
  },
  'activity.detail': {
    methods: ["GET","HEAD"],
    pattern: '/activity/:collection/:rkey',
    tokens: [[0,"activity"],[1,"collection"],[1,"rkey"]],
    types: placeholder as Registry['activity.detail']['types'],
  },
  'account.onboarding': {
    methods: ["GET","HEAD"],
    pattern: '/onboarding',
    tokens: [[0,"onboarding"]],
    types: placeholder as Registry['account.onboarding']['types'],
  },
  'account.store_acceptance': {
    methods: ["POST"],
    pattern: '/onboarding',
    tokens: [[0,"onboarding"]],
    types: placeholder as Registry['account.store_acceptance']['types'],
  },
  'files.show': {
    methods: ["GET","HEAD"],
    pattern: '/files',
    tokens: [[0,"files"]],
    types: placeholder as Registry['files.show']['types'],
  },
  'account.dismiss_welcome': {
    methods: ["POST"],
    pattern: '/account/dismiss-welcome',
    tokens: [[0,"account"],[0,"dismiss-welcome"]],
    types: placeholder as Registry['account.dismiss_welcome']['types'],
  },
  'discover.apps': {
    methods: ["GET","HEAD"],
    pattern: '/apps',
    tokens: [[0,"apps"]],
    types: placeholder as Registry['discover.apps']['types'],
  },
  'discover.app': {
    methods: ["GET","HEAD"],
    pattern: '/apps/:rkey',
    tokens: [[0,"apps"],[1,"rkey"]],
    types: placeholder as Registry['discover.app']['types'],
  },
  'legal.show': {
    methods: ["GET","HEAD"],
    pattern: '/legal/:document',
    tokens: [[0,"legal"],[1,"document"]],
    types: placeholder as Registry['legal.show']['types'],
  },
  'explore.learn_more': {
    methods: ["GET","HEAD"],
    pattern: '/explore/learn-more',
    tokens: [[0,"explore"],[0,"learn-more"]],
    types: placeholder as Registry['explore.learn_more']['types'],
  },
  'faq.show': {
    methods: ["GET","HEAD"],
    pattern: '/faq',
    tokens: [[0,"faq"]],
    types: placeholder as Registry['faq.show']['types'],
  },
  'health_checks.live': {
    methods: ["GET","HEAD"],
    pattern: '/_health',
    tokens: [[0,"_health"]],
    types: placeholder as Registry['health_checks.live']['types'],
  },
  'health_checks.ready': {
    methods: ["GET","HEAD"],
    pattern: '/_readiness',
    tokens: [[0,"_readiness"]],
    types: placeholder as Registry['health_checks.ready']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
