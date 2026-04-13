/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'oauth.logout': {
    methods: ["POST"]
    pattern: '/oauth/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['logout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['logout']>>>
    }
  }
  'oauth.login': {
    methods: ["POST"]
    pattern: '/oauth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/oauth').loginRequestValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/oauth').loginRequestValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['login']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['login']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'oauth.signup': {
    methods: ["POST"]
    pattern: '/oauth/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/oauth').signupRequestValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/oauth').signupRequestValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['signup']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['signup']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'oauth.callback': {
    methods: ["GET","HEAD"]
    pattern: '/oauth/callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['callback']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['callback']>>>
    }
  }
  'home': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/home_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/home_controller').default['show']>>>
    }
  }
  'account.create': {
    methods: ["GET","HEAD"]
    pattern: '/create-account'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['create']>>>
    }
  }
  'auth.login': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['login']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['login']>>>
    }
  }
  'dashboard.show': {
    methods: ["GET","HEAD"]
    pattern: '/dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['show']>>>
    }
  }
  'explore.learn_more': {
    methods: ["GET","HEAD"]
    pattern: '/explore/learn-more'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/explore_controller').default['learnMore']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/explore_controller').default['learnMore']>>>
    }
  }
  'account.onboarding': {
    methods: ["GET","HEAD"]
    pattern: '/onboarding'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['onboarding']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['onboarding']>>>
    }
  }
  'account.store_acceptance': {
    methods: ["POST"]
    pattern: '/onboarding'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/legal').termsRequestValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/legal').termsRequestValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['storeAcceptance']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['storeAcceptance']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'account.dismiss_welcome': {
    methods: ["POST"]
    pattern: '/account/dismiss-welcome'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['dismissWelcome']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['dismissWelcome']>>>
    }
  }
  'legal.show': {
    methods: ["GET","HEAD"]
    pattern: '/legal/:document'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { document: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/legal').legalValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/legal_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/legal_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'faq.show': {
    methods: ["GET","HEAD"]
    pattern: '/faq'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/faq_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/faq_controller').default['show']>>>
    }
  }
}
