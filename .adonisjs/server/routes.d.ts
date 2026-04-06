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
    'dashboard.show': { paramsTuple?: []; params?: {} }
    'dashboard.explore': { paramsTuple?: []; params?: {} }
    'account.onboarding': { paramsTuple?: []; params?: {} }
    'account.store_acceptance': { paramsTuple?: []; params?: {} }
    'account.dismiss_welcome': { paramsTuple?: []; params?: {} }
    'legal.show': { paramsTuple: [ParamValue]; params: {'document': ParamValue} }
  }
  GET: {
    'oauth.callback': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'account.create': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'dashboard.show': { paramsTuple?: []; params?: {} }
    'dashboard.explore': { paramsTuple?: []; params?: {} }
    'account.onboarding': { paramsTuple?: []; params?: {} }
    'legal.show': { paramsTuple: [ParamValue]; params: {'document': ParamValue} }
  }
  HEAD: {
    'oauth.callback': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'account.create': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'dashboard.show': { paramsTuple?: []; params?: {} }
    'dashboard.explore': { paramsTuple?: []; params?: {} }
    'account.onboarding': { paramsTuple?: []; params?: {} }
    'legal.show': { paramsTuple: [ParamValue]; params: {'document': ParamValue} }
  }
  POST: {
    'oauth.logout': { paramsTuple?: []; params?: {} }
    'oauth.login': { paramsTuple?: []; params?: {} }
    'oauth.signup': { paramsTuple?: []; params?: {} }
    'account.store_acceptance': { paramsTuple?: []; params?: {} }
    'account.dismiss_welcome': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}