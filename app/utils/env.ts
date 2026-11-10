/**
 * Create a parser of comma-separated environment variables.
 *
 * @param validate
 *   Validate and turn each item into a value (optional);
 *   such as `Env.schema.string({ format: 'url' })`.
 * @returns
 *   Parser, which gives the items (trimmed, empty ones dropped) or `undefined`
 *   if not set.
 */
export function commaSeparated(
  validate?: (key: string, value: string) => string
): (key: string, value?: string) => Array<string> | undefined {
  return function (key, value) {
    if (!value) return

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => (validate ? validate(key, item) : item))
  }
}
