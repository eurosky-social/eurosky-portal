import { configApp } from '@adonisjs/eslint-config'

export default configApp(
  { ignores: ['app/lexicons/**/*'] },
  // Isomorphic code (shared between backend and frontend):
  {
    files: ['inertia/**/*.{tsx,ts}'],
    rules: {
      '@adonisjs/no-backend-import-in-frontend': ['error', { allowed: ['#shared/**/*'] }],
    },
  }
)
