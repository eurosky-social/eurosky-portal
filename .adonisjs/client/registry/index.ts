/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'oauth.logout': {
    methods: ["POST"],
    pattern: '/oauth/logout',
    tokens: [{"old":"/oauth/logout","type":0,"val":"oauth","end":""},{"old":"/oauth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['oauth.logout']['types'],
  },
  'oauth.login': {
    methods: ["POST"],
    pattern: '/oauth/login',
    tokens: [{"old":"/oauth/login","type":0,"val":"oauth","end":""},{"old":"/oauth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['oauth.login']['types'],
  },
  'oauth.signup': {
    methods: ["POST"],
    pattern: '/oauth/signup',
    tokens: [{"old":"/oauth/signup","type":0,"val":"oauth","end":""},{"old":"/oauth/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['oauth.signup']['types'],
  },
  'oauth.callback': {
    methods: ["GET","HEAD"],
    pattern: '/oauth/callback',
    tokens: [{"old":"/oauth/callback","type":0,"val":"oauth","end":""},{"old":"/oauth/callback","type":0,"val":"callback","end":""}],
    types: placeholder as Registry['oauth.callback']['types'],
  },
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'account.create': {
    methods: ["GET","HEAD"],
    pattern: '/create-account',
    tokens: [{"old":"/create-account","type":0,"val":"create-account","end":""}],
    types: placeholder as Registry['account.create']['types'],
  },
  'auth.login': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.login']['types'],
  },
  'dashboard.show': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard',
    tokens: [{"old":"/dashboard","type":0,"val":"dashboard","end":""}],
    types: placeholder as Registry['dashboard.show']['types'],
  },
  'explore.learn_more': {
    methods: ["GET","HEAD"],
    pattern: '/explore/learn-more',
    tokens: [{"old":"/explore/learn-more","type":0,"val":"explore","end":""},{"old":"/explore/learn-more","type":0,"val":"learn-more","end":""}],
    types: placeholder as Registry['explore.learn_more']['types'],
  },
  'account.onboarding': {
    methods: ["GET","HEAD"],
    pattern: '/onboarding',
    tokens: [{"old":"/onboarding","type":0,"val":"onboarding","end":""}],
    types: placeholder as Registry['account.onboarding']['types'],
  },
  'account.store_acceptance': {
    methods: ["POST"],
    pattern: '/onboarding',
    tokens: [{"old":"/onboarding","type":0,"val":"onboarding","end":""}],
    types: placeholder as Registry['account.store_acceptance']['types'],
  },
  'account.dismiss_welcome': {
    methods: ["POST"],
    pattern: '/account/dismiss-welcome',
    tokens: [{"old":"/account/dismiss-welcome","type":0,"val":"account","end":""},{"old":"/account/dismiss-welcome","type":0,"val":"dismiss-welcome","end":""}],
    types: placeholder as Registry['account.dismiss_welcome']['types'],
  },
  'legal.show': {
    methods: ["GET","HEAD"],
    pattern: '/legal/:document',
    tokens: [{"old":"/legal/:document","type":0,"val":"legal","end":""},{"old":"/legal/:document","type":1,"val":"document","end":""}],
    types: placeholder as Registry['legal.show']['types'],
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
