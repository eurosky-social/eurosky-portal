/**
 * Configuration.
 */
export interface Options {
  /**
   * BCP 47 language of the text (example: `'en'`);
   * used to find words.
   */
  locale?: string | undefined

  /**
   * Max length in graphemes (required).
   */
  max: number
}

/**
 * Truncate text.
 *
 * @param value
 *   Text.
 * @param options
 *   Configuration (required).
 * @returns
 *   Text, truncated if needed.
 */
export function truncate(value: string, options: Options): string {
  const { locale, max } = options
  const graphemes = [...new Intl.Segmenter(locale).segment(value)]
  const ellipsis = graphemes[max - 1]

  if (graphemes.length <= max || !ellipsis) return value

  const end = ellipsis.index
  let wordEnd: number | undefined

  for (const word of new Intl.Segmenter(locale, { granularity: 'word' }).segment(value)) {
    const segmentEnd = word.index + word.segment.length
    if (segmentEnd > end) break
    if (word.isWordLike) wordEnd = segmentEnd
  }

  return value.slice(0, wordEnd ?? end).trimEnd() + '…'
}
