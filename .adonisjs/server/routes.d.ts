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
  }
  GET: {
    'oauth.callback': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'account.create': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'oauth.callback': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'account.create': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'oauth.logout': { paramsTuple?: []; params?: {} }
    'oauth.login': { paramsTuple?: []; params?: {} }
    'oauth.signup': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}