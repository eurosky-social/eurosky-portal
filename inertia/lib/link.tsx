/**
 * TODO: Update this component to use your client-side framework's link
 * component. We've provided examples of how to do this for Next.js, Remix, and
 * Inertia.js in the Catalyst documentation:
 *
 * https://catalyst.tailwindui.com/docs#client-side-router-integration
 */

import * as Headless from '@headlessui/react'
import { Link as InertiaLink, type LinkProps } from '@adonisjs/inertia/react'
import { shouldIntercept } from '@inertiajs/core'
import React, { forwardRef } from 'react'

/**
 * `Link` that uses `history.back()` when possible, meaning scroll position and
 * pagination are restored, and falls back to a normal link otherwise.
 */
export const BackLink = forwardRef(function BackLink(
  props: LinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        if (window.history.length <= 1 || !shouldIntercept(event.nativeEvent)) return
        event.preventDefault()
        window.history.back()
      }}
      ref={ref}
    />
  )
})

export const Link = forwardRef(function Link(
  props: LinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  return (
    <Headless.DataInteractive>
      <InertiaLink {...props} ref={ref} />
    </Headless.DataInteractive>
  )
})
