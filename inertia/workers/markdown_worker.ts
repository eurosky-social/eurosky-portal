/// <reference lib="webworker" />
import { sanitize } from 'hast-util-sanitize'
import { truncate } from 'hast-util-truncate'
import type { Nodes } from 'hast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toHast } from 'mdast-util-to-hast'

// Maximum size of *input* document; protects against people posting dangerous
// payloads.
const maxDocumentSize = 8192
// Maximum size of *output* document; related to the above but for a nice visual display.
const maxVisualSize = 4096

export interface WorkerRequest {
  value: string
}

interface WorkerResponseError {
  type: 'error'
}

interface WorkerResponseSuccess {
  tree: Nodes
  type: 'success'
}

export type WorkerResponse = WorkerResponseSuccess | WorkerResponseError

self.onmessage = onmessage

/**
 * @param event
 *   Message event.
 * @returns
 *   Nothing.
 */
function onmessage(event: MessageEvent<WorkerRequest>): undefined {
  let response: WorkerResponse

  try {
    const capped = event.data.value.slice(0, maxDocumentSize)
    const tree = truncate(sanitize(toHast(fromMarkdown(capped))), {
      ellipsis: '…',
      size: maxVisualSize,
    })
    response = { tree, type: 'success' }
  } catch {
    response = { type: 'error' }
  }

  self.postMessage(response)
}
