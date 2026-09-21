import type { ReactNode } from 'react'
import type { BskyAppProfile } from '#services/bsky_app_service'
import { useT } from '~/lib/i18n'

export function UserName({ user }: { user: BskyAppProfile | undefined }): ReactNode {
  const { t } = useT()
  const value = user?.displayName || (user?.handle ? '@' + user.handle : undefined) || undefined
  return <span className={value ? 'font-bold' : undefined}>{value || t('common.someone')}</span>
}
