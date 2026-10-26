import { router } from '@inertiajs/react'

/**
 * Move focus to the main heading when navigating to another page.
 *
 * Inertia swaps pages but focus stays on the old link and screen readers are
 * not told.
 * Focusing on the new `h1` (or `main`) announces the heading and tabbing
 * continues with the new content.
 *
 * @returns
 *   Function to stop listening.
 */
export function focusOnNavigate() {
  let previous = window.location.pathname

  return router.on('navigate', (event) => {
    const pathname = new URL(event.detail.page.url, window.location.href).pathname

    // Visits to the same path (partial reloads, query changes) are ignored,
    // so that polling or forms do not steal focus.
    if (pathname === previous) return
    previous = pathname
    if (event.detail.type === 'initial') return

    // Inertia fires `navigate` after the new page is rendered so we can select
    // things.
    const main = document.querySelector('main')
    const h1 = main?.querySelector('h1')
    const target = h1 ?? main
    if (!target) return
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')

    // `preventScroll: true` leaves inertia’s restoration of positions on Back
    // alone.
    target.focus({ preventScroll: true })
  })
}
