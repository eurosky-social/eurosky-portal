import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { Data } from '@generated/data'
import { usePage } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'

/**
 * Error flashed by the previous request, such as a failed sign in,
 * shown until the next page.
 */
export function FlashError() {
  const { props, url } = usePage<Data.SharedProps>()
  const error = props.flash.error
  const [message, setMessage] = useState<string | undefined>()
  const previousUrl = useRef(url)

  useEffect(
    function (): undefined {
      // Keep the message for partial reloads on the same page.
      if (error || url !== previousUrl.current) setMessage(error)
      previousUrl.current = url
    },
    [error, url]
  )

  return (
    <div role="alert">
      {message ? (
        <p className="flex items-center justify-center gap-2 border-b border-red-200 bg-red-50 px-3 py-2 text-center font-semibold text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          <ExclamationTriangleIcon aria-hidden="true" className="size-5 shrink-0" />
          {message}
        </p>
      ) : undefined}
    </div>
  )
}
