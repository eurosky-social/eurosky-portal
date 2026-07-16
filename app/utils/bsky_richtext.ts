import type { ElementContent } from 'hast'
import { sanitizeUri } from 'micromark-util-sanitize-uri'
import * as lexicon from '#lexicons'
import { segment } from '#utils/facets'

const allowedProtocols = /^https?$/i

function predicate(
  feature: lexicon.app.bsky.richtext.facet.$defs.Main['features'][number]
): boolean {
  return (
    lexicon.app.bsky.richtext.facet.link.isTypeOf(feature) ||
    lexicon.app.bsky.richtext.facet.mention.isTypeOf(feature) ||
    lexicon.app.bsky.richtext.facet.tag.isTypeOf(feature)
  )
}

function segmentToHast(
  text: string,
  facets: ReadonlyArray<lexicon.app.bsky.richtext.facet.Main>
): ElementContent {
  let node: ElementContent = { type: 'text', value: text }
  let linked = false

  for (const facet of facets) {
    for (const feature of facet.features) {
      if (lexicon.app.bsky.richtext.facet.link.isTypeOf(feature)) {
        const href = sanitizeUri(feature.uri, allowedProtocols)
        if (href && !linked) {
          node = { type: 'element', tagName: 'a', properties: { href }, children: [node] }
          linked = true
        }
      } else if (lexicon.app.bsky.richtext.facet.mention.isTypeOf(feature)) {
        if (!linked) {
          node = {
            type: 'element',
            tagName: 'a',
            properties: { href: `https://bsky.app/profile/${feature.did}` },
            children: [node],
          }
          linked = true
        }
      } else if (lexicon.app.bsky.richtext.facet.tag.isTypeOf(feature)) {
        if (!linked) {
          node = {
            type: 'element',
            tagName: 'a',
            properties: { href: `https://bsky.app/hashtag/${encodeURIComponent(feature.tag)}` },
            children: [node],
          }
          linked = true
        }
      }
      // Else: unknown.
    }
  }

  return node
}

/**
 * Turn bluesky post richtext into hast.
 *
 * @param text
 *   Value.
 * @param facets
 *   Facets.
 * @returns
 *   Root.
 */
export function toHast(
  text: string,
  facets: ReadonlyArray<lexicon.app.bsky.richtext.facet.Main> | undefined
): Array<ElementContent> {
  const relevant = (facets ?? []).filter((facet) => facet.features.some(predicate))
  return segment(text, relevant).map((d) => segmentToHast(d.text, d.facets))
}
