import { configApp } from '@adonisjs/eslint-config'

export default configApp(
  { ignores: ['app/lexicons/**/*'] },
  { rules: { '@typescript-eslint/no-shadow': 'off' } },
  // Isomorphic code (shared between backend and frontend):
  {
    files: ['inertia/**/*.{tsx,ts}'],
    rules: {
      '@adonisjs/no-backend-import-in-frontend': ['error', { allowed: ['#shared/**/*'] }],
    },
  }
)
