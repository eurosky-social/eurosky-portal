import { defaultClientConditions, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import adonisjs from '@adonisjs/vite/client'
import tailwindcss from '@tailwindcss/vite'

const VITE_ALIAS_HOSTS = (process.env.VITE_ALIAS_HOSTS ?? 'localhost').split(',')

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    adonisjs({
      entryPoints: ['inertia/app.tsx'],
      serverEntryPoints: ['inertia/ssr.tsx'],
      reload: ['resources/views/**/*.edge'],
    }),
  ],

  /**
   * Define aliases for importing modules from
   * your frontend code
   */
  resolve: {
    alias: {
      '~/': `${import.meta.dirname}/inertia/`,
      '@generated': `${import.meta.dirname}/.adonisjs/client/`,
    },
    // Make sure the `markdown_worker` does not get browser dependencies.
    conditions: ['worker', ...defaultClientConditions],
  },

  server: {
    allowedHosts: VITE_ALIAS_HOSTS,
    watch: {
      ignored: ['**/storage/**', '**/tmp/**'],
    },
  },
  preview: {
    allowedHosts: VITE_ALIAS_HOSTS,
  },
})
