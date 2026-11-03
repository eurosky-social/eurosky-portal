import { configApp } from '@adonisjs/eslint-config'

export default configApp(
  { ignores: ['app/lexicons/**/*', 'app/database/schema.ts'] },
  // Isomorphic code (shared between backend and frontend):
  {
    files: ['inertia/**/*.{tsx,ts}'],
    rules: {
      '@adonisjs/no-backend-import-in-frontend': ['error', { allowed: ['#shared/**/*'] }],
    },
  }
)
