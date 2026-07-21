import type { DidString } from '@atproto/lex'
import type { ElementContent, Element, Properties, Root } from 'hast'
import * as lexicon from '#lexicons'
import { type Context, toBlobLocator } from '#utils/blob'
import { toHast as richtext } from '#utils/leaflet_richtext'

// Register extra fields we pass through to render blobs.
// These are added on `<img>`s.
declare module 'hast' {
  interface ElementData {
    blobCid?: string
    blobDid?: DidString
    blobPds?: string
  }
}

function block(
  value: lexicon.pub.leaflet.pages.linearDocument.Block['block'],
  context: Context
): ElementContent | undefined {
  if (lexicon.pub.leaflet.blocks.header.main.isTypeOf(value)) {
    return heading(value)
  }

  if (lexicon.pub.leaflet.blocks.image.main.isTypeOf(value)) {
    return image(value, context)
  }

  if (lexicon.pub.leaflet.blocks.orderedList.main.isTypeOf(value)) {
    return list(value, context, true)
  }

  if (lexicon.pub.leaflet.blocks.text.main.isTypeOf(value)) {
    return paragraph(value)
  }

  if (lexicon.pub.leaflet.blocks.unorderedList.main.isTypeOf(value)) {
    return list(value, context, false)
  }

  // Else: `pub.leaflet.blocks.iframe`,
  // `pub.leaflet.blocks.blockquote`,
  // `pub.leaflet.blocks.imageGallery`,
  // unknown, etc.
}

function document(
  value: lexicon.pub.leaflet.content.Main['pages'][number],
  context: Context
): Array<ElementContent> {
  if (lexicon.pub.leaflet.pages.linearDocument.main.isTypeOf(value)) {
    const results: Array<ElementContent> = []
    for (const node of value.blocks) {
      const result = block(node.block, context)
      if (result) results.push(result)
    }
    return results
  }

  // Else: `pub.leaflet.pages.canvas` or unknown.
  return []
}

function heading(value: lexicon.pub.leaflet.blocks.header.Main): Element {
  const rank = Math.min(value.level ?? 1, 6)
  const children = richtext(value.plaintext, value.facets)
  return { type: 'element', tagName: `h${rank}`, properties: {}, children }
}

function image(value: lexicon.pub.leaflet.blocks.image.Main, context: Context): Element {
  const locator = toBlobLocator(value.image, context)
  const properties: Properties = { alt: value.alt }

  // Images are often compressed quite high, so displaying at half size looks
  // sharper.
  // But: skip implausibly small values (say, `16/9`, as that’s likely a reduced
  // ratio, not real dimensions), which would otherwise render a tiny image.
  if (value.aspectRatio.height >= 30 && value.aspectRatio.width >= 30) {
    properties.height = Math.floor(value.aspectRatio.height / 2)
    properties.width = Math.floor(value.aspectRatio.width / 2)
  }

  return {
    type: 'element',
    tagName: 'img',
    properties,
    data: { blobCid: locator.cid, blobDid: locator.did, blobPds: locator.pds },
    children: [],
  }
}

function listItemContent(
  value: lexicon.pub.leaflet.blocks.orderedList.ListItem['content'],
  context: Context
): ElementContent | undefined {
  if (lexicon.pub.leaflet.blocks.header.main.isTypeOf(value)) return heading(value)
  if (lexicon.pub.leaflet.blocks.image.main.isTypeOf(value)) return image(value, context)
  if (lexicon.pub.leaflet.blocks.text.main.isTypeOf(value)) return paragraph(value)
  // Else: unknown.
}

function listItems(
  nodes: ReadonlyArray<
    | lexicon.pub.leaflet.blocks.orderedList.ListItem
    | lexicon.pub.leaflet.blocks.unorderedList.ListItem
  >,
  context: Context,
  ordered: boolean
): Array<ElementContent> {
  const children: Array<ElementContent> = []
  for (const child of nodes) {
    const node = listItemContent(child.content, context)
    const results = node ? [node] : []

    // See <https://github.com/syntax-tree/mdast-util-to-hast/blob/174795b/lib/handlers/list-item.js#L27>
    if (child.checked !== undefined) {
      let head: Element

      if (node && node.type === 'element' && node.tagName === 'p') {
        head = node
      } else {
        head = { type: 'element', tagName: 'p', properties: {}, children: [] }
        results.unshift(head)
      }

      if (head.children.length > 0) {
        head.children.unshift({ type: 'text', value: ' ' })
      }

      head.children.unshift({
        type: 'element',
        tagName: 'input',
        properties: { type: 'checkbox', checked: child.checked, disabled: true },
        children: [],
      })
    }

    if ('children' in child) {
      results.push({
        type: 'element',
        tagName: ordered ? 'ol' : 'ul',
        properties: {},
        children: listItems(child.children ?? [], context, ordered),
      })
    } else if ('orderedListChildren' in child && child.orderedListChildren) {
      results.push(list(child.orderedListChildren, context, true))
    } else if ('unorderedListChildren' in child && child.unorderedListChildren) {
      results.push(list(child.unorderedListChildren, context, false))
    }

    children.push({
      type: 'element',
      tagName: 'li',
      properties: {},
      children: results,
    })
  }

  return children
}

function list(
  value:
    | lexicon.pub.leaflet.blocks.orderedList.Main
    | lexicon.pub.leaflet.blocks.unorderedList.Main,
  context: Context,
  ordered: boolean
): Element {
  const tagName = ordered ? 'ol' : 'ul'
  const properties: Properties = {}
  const children = listItems(value.children, context, ordered)

  if ('startIndex' in value && value.startIndex && value.startIndex !== 1) {
    properties.start = value.startIndex
  }

  return { type: 'element', tagName, properties, children }
}

function paragraph(value: lexicon.pub.leaflet.blocks.text.Main): Element {
  const children = richtext(value.plaintext, value.facets)
  return { type: 'element', tagName: 'p', properties: {}, children }
}

/**
 * Turn a leaflet lexicon value into a hast tree.
 * Many things deliberately dropped for now.
 *
 * @param value
 *   Value.
 * @param context
 *   DID + PDS.
 * @returns
 *   Root.
 */
export function toHast(value: lexicon.pub.leaflet.content.Main, context: Context): Root {
  const children = value.pages.flatMap((page) => document(page, context))
  return { type: 'root', children }
}
