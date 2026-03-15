import type { InertiaConfigFor } from '@inertiajs/core'
import { usePage } from '@inertiajs/react'

type AuthUser = NonNullable<InertiaConfigFor<'sharedPageProps'>['user']>

export function useAuth(): AuthUser {
  const { props } = usePage()
  if (!props.user) {
    throw new Error('useAuth called from logged out page')
  }

  return props.user
}
