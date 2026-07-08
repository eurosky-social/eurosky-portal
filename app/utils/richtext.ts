import type { DidString } from '@atproto/lex'
import * as lexicon from '#lexicons'

type Facet = lexicon.app.bsky.richtext.facet.Main

export type FeatureLink = {
  type: 'link'
  uri: string
}

export type FeatureMention = {
  did: DidString
  type: 'mention'
}

export type FeatureTag = {
  tag: string
  type: 'tag'
}

export type Feature = FeatureLink | FeatureMention | FeatureTag

export type Segment = {
  feature: Feature | undefined
  text: string
}

/**
 * Split text into segments using its facets.
 *
 * @param text
 * @param facets
 * @returns
 *   Segments.
 */
export function annotate(text: string, facets: ReadonlyArray<Facet> | undefined): Array<Segment> {
  const bytes = new TextEncoder().encode(text)
  const decoder = new TextDecoder()
  const result: Array<Segment> = []
  const sorted = [...(facets ?? [])].sort((a, b) => a.index.byteStart - b.index.byteStart)

  let cursor = 0

  for (const facet of sorted) {
    const { byteEnd, byteStart } = facet.index
    if (byteStart < cursor || byteEnd > bytes.length || byteStart >= byteEnd) continue

    const feature = toFeature(facet)
    if (!feature) continue

    const before = decoder.decode(bytes.slice(cursor, byteStart))
    const value = decoder.decode(bytes.slice(byteStart, byteEnd))

    if (before) result.push({ feature: undefined, text: before })
    if (value) result.push({ feature, text: value })

    cursor = byteEnd
  }

  const after = decoder.decode(bytes.slice(cursor))
  if (after) result.push({ feature: undefined, text: after })

  return result
}

/**
 * Find the first known feature on a facet.
 */
function toFeature(facet: Facet): Feature | undefined {
  const { link, mention, tag } = lexicon.app.bsky.richtext.facet

  for (const raw of facet.features) {
    if (link.isTypeOf(raw)) return { type: 'link', uri: raw.uri }
    if (mention.isTypeOf(raw)) return { did: raw.did, type: 'mention' }
    if (tag.isTypeOf(raw)) return { tag: raw.tag, type: 'tag' }
  }
}
