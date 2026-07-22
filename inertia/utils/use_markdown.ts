import type { Nodes } from 'hast'
import { useEffect, useState } from 'react'
import type { WorkerRequest, WorkerResponse } from '~/workers/markdown_worker'

interface ResultError {
  type: 'error'
}

interface ResultLoading {
  type: 'loading'
}

interface ResultReady {
  tree: Nodes | undefined
  type: 'ready'
}

type Result = ResultError | ResultLoading | ResultReady

// Max time before termination; one worker per task.
const timeout = 1000

/**
 * Turn potentially dangerous markdown strings into a safe hast tree.
 *
 * See `markdown_worker.ts` for most of the actual markdown processing code.
 * Code here deals with the worker from the outside.
 *
 * #### Safety
 *
 * * input capped at `8192` characters
 * * visible output capped at `4096` characters
 * * no html in the input (no `allowDangerousHtml` passed to `mdast-util-from-markdown`)
 * * nothing that GH does not allow (`hast-util-sanitize`)
 * * work done in a web worker, so no blocking, plus termination
 *
 * @param value
 *   Markdown.
 * @returns
 *   Result.
 */
export function useMarkdown(value: string | undefined): Result {
  const [previousValue, setPreviousValue] = useState(value)
  const [result, setResult] = useState(() => initialResult(value))

  if (value !== previousValue) {
    setPreviousValue(value)
    setResult(initialResult(value))
  }

  useEffect(() => {
    if (!value) return

    let settled = false

    const request: WorkerRequest = { value }
    const timeoutId = setTimeout(ontimeout, timeout)
    const url = new URL('../workers/markdown_worker.ts', import.meta.url)
    const worker = new Worker(url, { type: 'module' })

    worker.onerror = onerror
    worker.onmessage = onmessage
    worker.postMessage(request)

    return destructor

    function destructor(): undefined {
      settled = true
      clearTimeout(timeoutId)
      worker.terminate()
    }

    function finish(next: Result): undefined {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      worker.terminate()
      setResult(next)
    }

    function onerror(): undefined {
      finish({ type: 'error' })
    }

    function onmessage(event: MessageEvent<WorkerResponse>): undefined {
      finish(
        event.data.type === 'success' ? { tree: event.data.tree, type: 'ready' } : { type: 'error' }
      )
    }

    function ontimeout() {
      finish({ type: 'error' })
    }
  }, [value])

  return result
}

function initialResult(value: string | undefined): Result {
  return value ? { type: 'loading' } : { tree: undefined, type: 'ready' }
}
