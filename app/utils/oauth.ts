import env from '#start/env'

export function getHandleDomain(): string | undefined {
  let value = env.get('ATPROTO_HANDLE_DOMAIN')
  if (!value) {
    return undefined
  }
  if (value.startsWith('.')) {
    return value
  }
  return '.' + value
}
