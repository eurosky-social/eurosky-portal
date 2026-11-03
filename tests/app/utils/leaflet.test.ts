import assert from 'node:assert/strict'
import test from 'node:test'
import { jsonToLex } from '@atproto/lex'
import * as lexicon from '#lexicons/index'
import { toHast } from '#utils/leaflet'

// Raw (`bafkrei`), then all-zero SHA-256 hash.
const cid = `bafkrei${'a'.repeat(52)}`
const context = { did: 'did:web:a.com', pds: 'https://b.com' } as const
const image = {
  $type: 'blob',
  mimeType: 'image/png',
  ref: { $link: cid },
  size: 1,
} as const
const text = { $type: 'pub.leaflet.blocks.text', plaintext: 'a' } as const
const paragraph = {
  children: [{ type: 'text', value: 'a' }],
  properties: {},
  tagName: 'p',
  type: 'element',
} as const

test('toHast', function () {
  test('should support text', function () {
    const content = lexicon.pub.leaflet.content.$parse(
      jsonToLex({
        pages: [{ $type: 'pub.leaflet.pages.linearDocument', blocks: [{ block: text }] }],
      })
    )
    const result = toHast(content, context)

    assert.deepEqual(result, { children: [paragraph], type: 'root' })
  })

  test('should support headers', function () {
    const content = lexicon.pub.leaflet.content.$parse(
      jsonToLex({
        pages: [
          {
            $type: 'pub.leaflet.pages.linearDocument',
            blocks: [{ block: { $type: 'pub.leaflet.blocks.header', level: 2, plaintext: 'a' } }],
          },
        ],
      })
    )
    const result = toHast(content, context)

    assert.deepEqual(result, {
      children: [
        {
          children: [{ type: 'text', value: 'a' }],
          properties: {},
          tagName: 'h2',
          type: 'element',
        },
      ],
      type: 'root',
    })
  })

  test('should cap header levels at 6', function () {
    // Built instead of parsed as it is invalid (maximum `6`); could come from a PDS.
    const content = lexicon.pub.leaflet.content.$build({
      pages: [
        {
          $type: 'pub.leaflet.pages.linearDocument',
          blocks: [{ block: { $type: 'pub.leaflet.blocks.header', level: 9, plaintext: 'a' } }],
        },
      ],
    })
    const result = toHast(content, context)

    assert.deepEqual(result, {
      children: [
        {
          children: [{ type: 'text', value: 'a' }],
          properties: {},
          tagName: 'h6',
          type: 'element',
        },
      ],
      type: 'root',
    })
  })

  test('should show images at half size', function () {
    const content = lexicon.pub.leaflet.content.$parse(
      jsonToLex({
        pages: [
          {
            $type: 'pub.leaflet.pages.linearDocument',
            blocks: [
              {
                block: {
                  $type: 'pub.leaflet.blocks.image',
                  alt: 'a',
                  aspectRatio: { height: 60, width: 90 },
                  image,
                },
              },
            ],
          },
        ],
      })
    )
    const result = toHast(content, context)

    assert.deepEqual(result, {
      children: [
        {
          children: [],
          data: { blobCid: cid, blobDid: context.did, blobPds: context.pds, position: {} },
          properties: { alt: 'a', height: 30, width: 45 },
          tagName: 'img',
          type: 'element',
        },
      ],
      type: 'root',
    })
  })

  test('should not size images with a reduced ratio', function () {
    const content = lexicon.pub.leaflet.content.$parse(
      jsonToLex({
        pages: [
          {
            $type: 'pub.leaflet.pages.linearDocument',
            blocks: [
              {
                block: {
                  $type: 'pub.leaflet.blocks.image',
                  alt: 'a',
                  aspectRatio: { height: 9, width: 16 },
                  image,
                },
              },
            ],
          },
        ],
      })
    )
    const result = toHast(content, context)

    assert.deepEqual(result, {
      children: [
        {
          children: [],
          data: { blobCid: cid, blobDid: context.did, blobPds: context.pds, position: {} },
          properties: { alt: 'a' },
          tagName: 'img',
          type: 'element',
        },
      ],
      type: 'root',
    })
  })

  test('should support ordered lists with `startIndex`', function () {
    const content = lexicon.pub.leaflet.content.$parse(
      jsonToLex({
        pages: [
          {
            $type: 'pub.leaflet.pages.linearDocument',
            blocks: [
              {
                block: {
                  $type: 'pub.leaflet.blocks.orderedList',
                  children: [{ content: text }],
                  startIndex: 3,
                },
              },
            ],
          },
        ],
      })
    )
    const result = toHast(content, context)

    assert.deepEqual(result, {
      children: [
        {
          children: [{ children: [paragraph], properties: {}, tagName: 'li', type: 'element' }],
          properties: { start: 3 },
          tagName: 'ol',
          type: 'element',
        },
      ],
      type: 'root',
    })
  })

  test('should support nested unordered lists', function () {
    const content = lexicon.pub.leaflet.content.$parse(
      jsonToLex({
        pages: [
          {
            $type: 'pub.leaflet.pages.linearDocument',
            blocks: [
              {
                block: {
                  $type: 'pub.leaflet.blocks.unorderedList',
                  children: [{ children: [{ content: text }], content: text }],
                },
              },
            ],
          },
        ],
      })
    )
    const result = toHast(content, context)

    assert.deepEqual(result, {
      children: [
        {
          children: [
            {
              children: [
                paragraph,
                {
                  children: [
                    { children: [paragraph], properties: {}, tagName: 'li', type: 'element' },
                  ],
                  properties: {},
                  tagName: 'ul',
                  type: 'element',
                },
              ],
              properties: {},
              tagName: 'li',
              type: 'element',
            },
          ],
          properties: {},
          tagName: 'ul',
          type: 'element',
        },
      ],
      type: 'root',
    })
  })

  test('should support `orderedListChildren` in unordered lists', function () {
    const content = lexicon.pub.leaflet.content.$parse(
      jsonToLex({
        pages: [
          {
            $type: 'pub.leaflet.pages.linearDocument',
            blocks: [
              {
                block: {
                  $type: 'pub.leaflet.blocks.unorderedList',
                  children: [
                    {
                      content: text,
                      orderedListChildren: {
                        $type: 'pub.leaflet.blocks.orderedList',
                        children: [],
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      })
    )
    const result = toHast(content, context)

    assert.deepEqual(result, {
      children: [
        {
          children: [
            {
              children: [
                paragraph,
                { children: [], properties: {}, tagName: 'ol', type: 'element' },
              ],
              properties: {},
              tagName: 'li',
              type: 'element',
            },
          ],
          properties: {},
          tagName: 'ul',
          type: 'element',
        },
      ],
      type: 'root',
    })
  })

  test('should support `unorderedListChildren` in ordered lists', function () {
    const content = lexicon.pub.leaflet.content.$parse(
      jsonToLex({
        pages: [
          {
            $type: 'pub.leaflet.pages.linearDocument',
            blocks: [
              {
                block: {
                  $type: 'pub.leaflet.blocks.orderedList',
                  children: [
                    {
                      content: text,
                      unorderedListChildren: {
                        $type: 'pub.leaflet.blocks.unorderedList',
                        children: [],
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      })
    )
    const result = toHast(content, context)

    assert.deepEqual(result, {
      children: [
        {
          children: [
            {
              children: [
                paragraph,
                { children: [], properties: {}, tagName: 'ul', type: 'element' },
              ],
              properties: {},
              tagName: 'li',
              type: 'element',
            },
          ],
          properties: {},
          tagName: 'ol',
          type: 'element',
        },
      ],
      type: 'root',
    })
  })

  test('should add a checkbox to checked items', function () {
    const content = lexicon.pub.leaflet.content.$parse(
      jsonToLex({
        pages: [
          {
            $type: 'pub.leaflet.pages.linearDocument',
            blocks: [
              {
                block: {
                  $type: 'pub.leaflet.blocks.unorderedList',
                  children: [{ checked: true, content: text }],
                },
              },
            ],
          },
        ],
      })
    )
    const result = toHast(content, context)

    assert.deepEqual(result, {
      children: [
        {
          children: [
            {
              children: [
                {
                  children: [
                    {
                      children: [],
                      properties: { checked: true, disabled: true, type: 'checkbox' },
                      tagName: 'input',
                      type: 'element',
                    },
                    { type: 'text', value: ' ' },
                    { type: 'text', value: 'a' },
                  ],
                  properties: {},
                  tagName: 'p',
                  type: 'element',
                },
              ],
              properties: {},
              tagName: 'li',
              type: 'element',
            },
          ],
          properties: {},
          tagName: 'ul',
          type: 'element',
        },
      ],
      type: 'root',
    })
  })

  test('should add a paragraph for checkboxes of items that are not paragraphs', function () {
    const content = lexicon.pub.leaflet.content.$parse(
      jsonToLex({
        pages: [
          {
            $type: 'pub.leaflet.pages.linearDocument',
            blocks: [
              {
                block: {
                  $type: 'pub.leaflet.blocks.unorderedList',
                  children: [
                    {
                      checked: false,
                      content: { $type: 'pub.leaflet.blocks.header', plaintext: 'a' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      })
    )
    const result = toHast(content, context)

    assert.deepEqual(result, {
      children: [
        {
          children: [
            {
              children: [
                {
                  children: [
                    {
                      children: [],
                      properties: { checked: false, disabled: true, type: 'checkbox' },
                      tagName: 'input',
                      type: 'element',
                    },
                  ],
                  properties: {},
                  tagName: 'p',
                  type: 'element',
                },
                {
                  children: [{ type: 'text', value: 'a' }],
                  properties: {},
                  tagName: 'h1',
                  type: 'element',
                },
              ],
              properties: {},
              tagName: 'li',
              type: 'element',
            },
          ],
          properties: {},
          tagName: 'ul',
          type: 'element',
        },
      ],
      type: 'root',
    })
  })

  test('should drop unknown blocks', function () {
    const content = lexicon.pub.leaflet.content.$parse(
      jsonToLex({
        pages: [
          {
            $type: 'pub.leaflet.pages.linearDocument',
            blocks: [{ block: { $type: 'pub.leaflet.blocks.horizontalRule' } }, { block: text }],
          },
        ],
      })
    )
    const result = toHast(content, context)

    assert.deepEqual(result, { children: [paragraph], type: 'root' })
  })

  test('should drop canvas pages', function () {
    const content = lexicon.pub.leaflet.content.$parse(
      jsonToLex({ pages: [{ $type: 'pub.leaflet.pages.canvas', blocks: [] }] })
    )
    const result = toHast(content, context)

    assert.deepEqual(result, { children: [], type: 'root' })
  })
})
