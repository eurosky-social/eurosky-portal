interface ByteSlice {
  byteEnd: number
  byteStart: number
}

interface FacetLike {
  index: ByteSlice
}

interface Segment<Facet extends FacetLike> {
  facets: Array<Facet>
  text: string
}

const encoder = new TextEncoder()

function byteLength(text: string): number {
  return encoder.encode(text).length
}

function same<Facet extends FacetLike>(
  left: ReadonlyArray<Facet>,
  right: ReadonlyArray<Facet>
): boolean {
  return left.length === right.length && left.every((facet, index) => facet === right[index])
}

/**
 * Split text into segments, grouping facets together.
 *
 * Facets can legitimately overlap: say one `strong` facet from 0 to 10 and a
 * separate `emphasis` one from 5 to 15.
 *
 * @param text
 *   Text.
 * @param facets
 *   Facets.
 * @returns
 *   Segments, in order, each with the facets covering it.
 */
export function segment<Facet extends FacetLike>(
  text: string,
  facets: ReadonlyArray<Facet> | undefined
): Array<Segment<Facet>> {
  if (text.length === 0) return []

  const ranges = facets ?? []
  if (ranges.length === 0) return [{ facets: [], text }]

  const boundsSet = new Set([0, byteLength(text)])

  for (const range of ranges) {
    boundsSet.add(range.index.byteStart)
    boundsSet.add(range.index.byteEnd)
  }

  const bounds = [...boundsSet].sort(sort)
  const segments: Array<Segment<Facet>> = []
  let buffer = ''
  let byteIndex = 0
  let boundIndex = 1
  let segmentStartByte = 0

  for (const character of text) {
    if (byteIndex >= bounds[boundIndex]) {
      flush()
      segmentStartByte = byteIndex
      while (boundIndex < bounds.length - 1 && bounds[boundIndex] <= byteIndex) boundIndex++
    }

    buffer += character
    byteIndex += byteLength(character)
  }

  flush()

  return segments

  function facetsAt(bytePosition: number): Array<Facet> {
    return ranges.filter(
      (range) => bytePosition >= range.index.byteStart && bytePosition < range.index.byteEnd
    )
  }

  function flush(): undefined {
    if (!buffer) return

    const covering = facetsAt(segmentStartByte)
    const last = segments.at(-1)

    if (last && same(last.facets, covering)) {
      last.text += buffer
    } else {
      segments.push({ facets: covering, text: buffer })
    }

    buffer = ''
  }
}

function sort(left: number, right: number): number {
  return left - right
}
