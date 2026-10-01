import { getCurrentSpan } from '@adonisjs/otel/helpers'

/**
 * Value of a span attribute.
 */
type AttributeValue = boolean | number | string

/**
 * Span attributes.
 */
type Attributes = Record<string, AttributeValue>

/**
 * Value of a field;
 * `null` and `undefined` are dropped.
 */
type FieldValue = boolean | number | string | null | undefined

/**
 * Fields to attach to an event.
 */
type Fields = Record<string, FieldValue>

/**
 * Configuration for `captureMessage`.
 */
interface CaptureMessageOptions extends CaptureOptions {
  /**
   * Severity (default: `'info'`).
   */
  level?: 'error' | 'info' | 'warning' | null | undefined
}

/**
 * Configuration for `captureException`.
 */
interface CaptureOptions {
  /**
   * Context about this occurrence, recorded as `extra.*` attributes.
   */
  extra?: Fields | null | undefined

  /**
   * Labels to group and filter by, recorded as `tags.*` attributes.
   */
  tags?: Fields | null | undefined
}

/**
 * Record an exception as an event on the active span.
 *
 * Does nothing when OpenTelemetry is disabled or there is no active span.
 *
 * @param error
 *   Error;
 *   other values are turned into a string.
 * @param options
 *   Configuration (optional).
 * @returns
 *   Nothing.
 */
export function captureException(error: unknown, options?: CaptureOptions | null | undefined) {
  const span = getCurrentSpan()
  if (!span) return

  const exception = error instanceof Error ? error : new Error(String(error))

  span.addEvent('exception', {
    ...toAttributes(options),
    'exception.message': exception.message,
    'exception.stacktrace': exception.stack,
    'exception.type': exception.name,
  })
}

/**
 * Record a message as an event on the active span.
 *
 * Does nothing when OpenTelemetry is disabled or there is no active span.
 *
 * @param message
 *   Message, used as the event name.
 * @param options
 *   Configuration (optional).
 * @returns
 *   Nothing.
 */
export function captureMessage(
  message: string,
  options?: CaptureMessageOptions | null | undefined
) {
  const span = getCurrentSpan()
  if (!span) return
  span.addEvent(message, { ...toAttributes(options), level: options?.level ?? 'info' })
}

/**
 * Add fields to attributes, prefixed, dropping `null` and `undefined`.
 *
 * @param attributes
 *   Attributes to add to.
 * @param prefix
 *   Prefix for keys (such as `'tags'`).
 * @param record
 *   Fields to add.
 * @returns
 *   Nothing.
 */
function setAttributes(attributes: Attributes, prefix: string, record: Fields | null | undefined) {
  if (!record) return
  for (const [key, value] of Object.entries(record)) {
    if (value !== null && value !== undefined) {
      attributes[`${prefix}.${key}`] = value
    }
  }
}

/**
 * Turn capture options into span attributes.
 *
 * @param options
 *   Configuration (optional).
 * @returns
 *   Attributes.
 */
function toAttributes(options?: CaptureOptions | null | undefined): Attributes {
  const attributes: Attributes = {}
  if (!options) return attributes
  setAttributes(attributes, 'extra', options.extra)
  setAttributes(attributes, 'tags', options.tags)
  return attributes
}
