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
