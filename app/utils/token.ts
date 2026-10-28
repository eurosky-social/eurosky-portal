/**
 * Encode a value as an opaque token (base64url-encoded JSON).
 *
 * @param value
 *   Value.
 * @returns
 *   Token.
 */
export function encodeToken(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

/**
 * Decode a token made by {@linkcode encodeToken}.
 *
 * @param token
 *   Token.
 * @returns
 *   Object or `undefined` if invalid.
 */
export function decodeToken(token: string): Partial<Record<string, unknown>> | undefined {
  try {
    const value: unknown = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'))
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) return value
  } catch {}
}
