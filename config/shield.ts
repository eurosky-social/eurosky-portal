import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  /**
   * Configure CSP policies for your app. Refer documentation
   * to learn more.
   */
  csp: {
    /**
     * Enable the Content-Security-Policy header.
     */
    enabled: true,

    /**
     * Per-resource CSP directives.
     */
    directives: {
      baseUri: ["'self'"],
      // Opening and downloading blobs fetches them from any PDS.
      // Vite uses a web socket in dev.
      connectSrc: ["'self'", 'https:', ...(app.inDev ? ['ws:'] : [])],
      defaultSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      // Avatars, blobs, and app icons come from any PDS.
      imgSrc: ["'self'", 'blob:', 'https:'],
      // Videos come from any PDS.
      mediaSrc: ["'self'", 'blob:', 'https:'],
      objectSrc: ["'none'"],
      // React refreshes with an inline script in development.
      scriptSrc: ["'self'", ...(app.inDev ? ['@nonce'] : [])],
      // `style` attributes (from React, also rendered on the server) and
      // `style` elements added by scripts, in production too.
      styleSrc: ["'self'", "'unsafe-inline'"],
      // Vite pings for a restarted server from a worker in development.
      workerSrc: ["'self'", ...(app.inDev ? ['blob:'] : [])],
    },

    /**
     * Report violations without blocking resources.
     */
    reportOnly: false,
  },

  /**
   * Configure CSRF protection options. Refer documentation
   * to learn more.
   */
  csrf: {
    /**
     * Enable CSRF token verification for state-changing requests.
     */
    enabled: true,

    /**
     * Route patterns to exclude from CSRF checks.
     * Useful for external webhooks or API endpoints.
     */
    exceptRoutes: ['/_dtp/media', '/oauth2/revoke', '/oauth2/token'],

    /**
     * Expose an encrypted XSRF-TOKEN cookie for frontend HTTP clients.
     */
    enableXsrfCookie: true,

    /**
     * HTTP methods protected by CSRF validation.
     */
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  /**
   * Control how your website should be embedded inside
   * iframes.
   */
  xFrame: {
    /**
     * Enable the X-Frame-Options header.
     */
    enabled: true,

    /**
     * Block all framing attempts. Default value is DENY.
     */
    action: 'DENY',
  },

  /**
   * Force browser to always use HTTPS.
   */
  hsts: {
    /**
     * Enable the Strict-Transport-Security header.
     */
    enabled: true,

    /**
     * HSTS policy duration remembered by browsers.
     */
    maxAge: '180 days',
  },

  /**
   * Disable browsers from sniffing content types and rely only
   * on the response content-type header.
   */
  contentTypeSniffing: {
    /**
     * Enable X-Content-Type-Options: nosniff.
     */
    enabled: true,
  },
})

export default shieldConfig
