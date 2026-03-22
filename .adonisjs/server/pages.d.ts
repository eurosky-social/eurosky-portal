import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'create-account': ExtractProps<(typeof import('../../inertia/pages/create-account.tsx'))['default']>
    'dashboard/show': ExtractProps<(typeof import('../../inertia/pages/dashboard/show.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'legal/show': ExtractProps<(typeof import('../../inertia/pages/legal/show.tsx'))['default']>
    'login': ExtractProps<(typeof import('../../inertia/pages/login.tsx'))['default']>
    'onboarding': ExtractProps<(typeof import('../../inertia/pages/onboarding.tsx'))['default']>
  }
}
