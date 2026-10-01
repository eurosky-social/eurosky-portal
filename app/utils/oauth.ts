import env from '#start/env'

/**
 * Query parameters of the OAuth callback that must not end up in logs or
 * traces.
 *
 * `response` carries the code when JARM is used.
 */
const callbackParams = ['code', 'iss', 'response', 'state']

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

/**
 * Redact OAuth callback parameters in a URL, path, or bare query string.
 */
export function redactCallbackParams(value: string, isQuery = false): string {
  const index = isQuery ? -1 : value.indexOf('?')
  if (!isQuery && index === -1) return value

  const params = new URLSearchParams(value.slice(index + 1))
  let changed = false

  for (const name of callbackParams) {
    if (params.has(name)) {
      params.set(name, 'REDACTED')
      changed = true
    }
  }

  return changed ? value.slice(0, index + 1) + params.toString() : value
}
