import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import adonisjs from '@adonisjs/vite/client'
import inertia from '@adonisjs/inertia/vite'
import tailwindcss from '@tailwindcss/vite'
import env from '#start/env'

const VITE_ALIAS_HOSTS = (process.env.VITE_ALIAS_HOSTS ?? 'localhost').split(',')

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    inertia({ ssr: { enabled: false, entrypoint: 'inertia/ssr.tsx' } }),
    adonisjs({ entrypoints: ['inertia/app.tsx'], reload: ['resources/views/**/*.edge'] }),
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
