import { defineConfig } from '@adonisjs/inertia'

const inertiaConfig = defineConfig({
  /**
   * Server-side rendering options.
   */
  ssr: {
    /**
     * Toggle SSR mode for Inertia pages.
     */
    enabled: true,

    /**
     * SSR for guests (public pages).
     */
    pages(ctx, page) {
      // Not the server error page, in case rendering on the server is what failed.
      return !ctx.auth?.user && page !== 'errors/server_error'
    },

    /**
     * Entry file used by the SSR server build.
     */
    entrypoint: 'inertia/ssr.tsx',
  },
})

export default inertiaConfig
