import { router } from '@inertiajs/react'
import { useEffect } from 'react'

const delay = 5_000

/**
 * Reload the page every few seconds while `active`.
 *
 * @param active
 *   Whether to poll.
 * @returns
 *   Nothing.
 */
export function usePoll(active: boolean): undefined {
  useEffect(
    function () {
      if (!active) return

      let cancelled = false
      let timeout: ReturnType<typeof setTimeout> | undefined

      poll()

      return function (): undefined {
        cancelled = true
        clearTimeout(timeout)
      }

      function poll(): undefined {
        timeout = setTimeout(function () {
          router.reload({
            onFinish() {
              if (!cancelled) poll()
            },
          })
        }, delay)
      }
    },
    [active]
  )
}
