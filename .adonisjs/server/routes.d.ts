import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'oauth.logout': { paramsTuple?: []; params?: {} }
    'oauth.login': { paramsTuple?: []; params?: {} }
    'oauth.signup': { paramsTuple?: []; params?: {} }
    'oauth.callback': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'account.create': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'account.dismiss_welcome': { paramsTuple?: []; params?: {} }
    'activity.show': { paramsTuple?: []; params?: {} }
    'activity.detail': { paramsTuple: [ParamValue,ParamValue]; params: {'collection': ParamValue,'rkey': ParamValue} }
    'discover.favorite': { paramsTuple: [ParamValue]; params: {'rkey': ParamValue} }
    'discover.unfavorite': { paramsTuple: [ParamValue]; params: {'rkey': ParamValue} }
    'connections.show': { paramsTuple?: []; params?: {} }
    'connections.destroy': { paramsTuple: [ParamValue]; params: {'clientId': ParamValue} }
    'dashboard.show': { paramsTuple?: []; params?: {} }
    'dashboard.apps': { paramsTuple?: []; params?: {} }
    'files.show': { paramsTuple?: []; params?: {} }
    'oauth2.authorize': { paramsTuple?: []; params?: {} }
    'oauth2.decide': { paramsTuple?: []; params?: {} }
    'account.onboarding': { paramsTuple?: []; params?: {} }
    'account.store_acceptance': { paramsTuple?: []; params?: {} }
    'health_checks.live': { paramsTuple?: []; params?: {} }
    'health_checks.ready': { paramsTuple?: []; params?: {} }
    'discover.apps': { paramsTuple?: []; params?: {} }
    'discover.app': { paramsTuple: [ParamValue]; params: {'rkey': ParamValue} }
    'explore.learn_more': { paramsTuple?: []; params?: {} }
    'faq.show': { paramsTuple?: []; params?: {} }
    'legal.show': { paramsTuple: [ParamValue]; params: {'document': ParamValue} }
    'oauth2.revoke': { paramsTuple?: []; params?: {} }
    'oauth2.token': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'oauth.callback': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'account.create': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'activity.show': { paramsTuple?: []; params?: {} }
    'activity.detail': { paramsTuple: [ParamValue,ParamValue]; params: {'collection': ParamValue,'rkey': ParamValue} }
    'connections.show': { paramsTuple?: []; params?: {} }
    'dashboard.show': { paramsTuple?: []; params?: {} }
    'dashboard.apps': { paramsTuple?: []; params?: {} }
    'files.show': { paramsTuple?: []; params?: {} }
    'oauth2.authorize': { paramsTuple?: []; params?: {} }
    'account.onboarding': { paramsTuple?: []; params?: {} }
    'health_checks.live': { paramsTuple?: []; params?: {} }
    'health_checks.ready': { paramsTuple?: []; params?: {} }
    'discover.apps': { paramsTuple?: []; params?: {} }
    'discover.app': { paramsTuple: [ParamValue]; params: {'rkey': ParamValue} }
    'explore.learn_more': { paramsTuple?: []; params?: {} }
    'faq.show': { paramsTuple?: []; params?: {} }
    'legal.show': { paramsTuple: [ParamValue]; params: {'document': ParamValue} }
  }
  HEAD: {
    'oauth.callback': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'account.create': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'activity.show': { paramsTuple?: []; params?: {} }
    'activity.detail': { paramsTuple: [ParamValue,ParamValue]; params: {'collection': ParamValue,'rkey': ParamValue} }
    'connections.show': { paramsTuple?: []; params?: {} }
    'dashboard.show': { paramsTuple?: []; params?: {} }
    'dashboard.apps': { paramsTuple?: []; params?: {} }
    'files.show': { paramsTuple?: []; params?: {} }
    'oauth2.authorize': { paramsTuple?: []; params?: {} }
    'account.onboarding': { paramsTuple?: []; params?: {} }
    'health_checks.live': { paramsTuple?: []; params?: {} }
    'health_checks.ready': { paramsTuple?: []; params?: {} }
    'discover.apps': { paramsTuple?: []; params?: {} }
    'discover.app': { paramsTuple: [ParamValue]; params: {'rkey': ParamValue} }
    'explore.learn_more': { paramsTuple?: []; params?: {} }
    'faq.show': { paramsTuple?: []; params?: {} }
    'legal.show': { paramsTuple: [ParamValue]; params: {'document': ParamValue} }
  }
  POST: {
    'oauth.logout': { paramsTuple?: []; params?: {} }
    'oauth.login': { paramsTuple?: []; params?: {} }
    'oauth.signup': { paramsTuple?: []; params?: {} }
    'account.dismiss_welcome': { paramsTuple?: []; params?: {} }
    'discover.favorite': { paramsTuple: [ParamValue]; params: {'rkey': ParamValue} }
    'oauth2.decide': { paramsTuple?: []; params?: {} }
    'account.store_acceptance': { paramsTuple?: []; params?: {} }
    'oauth2.revoke': { paramsTuple?: []; params?: {} }
    'oauth2.token': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'discover.unfavorite': { paramsTuple: [ParamValue]; params: {'rkey': ParamValue} }
    'connections.destroy': { paramsTuple: [ParamValue]; params: {'clientId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}