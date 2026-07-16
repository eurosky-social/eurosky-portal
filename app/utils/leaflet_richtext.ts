import type { ElementContent } from 'hast'
import { sanitizeUri } from 'micromark-util-sanitize-uri'
import * as lexicon from '#lexicons'
import { segment } from '#utils/facets'

const allowedProtocols = /^https?$/i

function predicate(
  feature: lexicon.pub.leaflet.richtext.facet.$defs.Main['features'][number]
): boolean {
  return (
    lexicon.pub.leaflet.richtext.facet.bold.isTypeOf(feature) ||
    lexicon.pub.leaflet.richtext.facet.code.isTypeOf(feature) ||
    lexicon.pub.leaflet.richtext.facet.highlight.isTypeOf(feature) ||
    lexicon.pub.leaflet.richtext.facet.italic.isTypeOf(feature) ||
    lexicon.pub.leaflet.richtext.facet.link.isTypeOf(feature) ||
    lexicon.pub.leaflet.richtext.facet.strikethrough.isTypeOf(feature) ||
    lexicon.pub.leaflet.richtext.facet.underline.isTypeOf(feature)
  )
}

function segmentToHast(
  text: string,
  facets: ReadonlyArray<lexicon.pub.leaflet.richtext.facet.Main>
): ElementContent {
  let node: ElementContent = { type: 'text', value: text }
  let linked = false

  for (const facet of facets) {
    for (const feature of facet.features) {
      if (lexicon.pub.leaflet.richtext.facet.bold.isTypeOf(feature)) {
        node = { type: 'element', tagName: 'strong', properties: {}, children: [node] }
      } else if (lexicon.pub.leaflet.richtext.facet.code.isTypeOf(feature)) {
        node = { type: 'element', tagName: 'code', properties: {}, children: [node] }
      } else if (lexicon.pub.leaflet.richtext.facet.highlight.isTypeOf(feature)) {
        node = { type: 'element', tagName: 'mark', properties: {}, children: [node] }
      } else if (lexicon.pub.leaflet.richtext.facet.italic.isTypeOf(feature)) {
        node = { type: 'element', tagName: 'em', properties: {}, children: [node] }
      } else if (lexicon.pub.leaflet.richtext.facet.link.isTypeOf(feature)) {
        const href = sanitizeUri(feature.uri, allowedProtocols)
        if (href && !linked) {
          node = {
            type: 'element',
            tagName: 'a',
            properties: { href },
            children: [node],
          }
          linked = true
        }
      } else if (lexicon.pub.leaflet.richtext.facet.strikethrough.isTypeOf(feature)) {
        node = { type: 'element', tagName: 'del', properties: {}, children: [node] }
      } else if (lexicon.pub.leaflet.richtext.facet.underline.isTypeOf(feature)) {
        node = { type: 'element', tagName: 'u', properties: {}, children: [node] }
      }
      // Else: atMention, didMention, footnote, id, unknown.
    }
  }

  return node
}

/**
 * Turn leaflet richtext into hast.
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
  facets: ReadonlyArray<lexicon.pub.leaflet.richtext.facet.Main> | undefined
): Array<ElementContent> {
  const relevant = (facets ?? []).filter((facet) => facet.features.some(predicate))
  return segment(text, relevant).map((d) => segmentToHast(d.text, d.facets))
}
