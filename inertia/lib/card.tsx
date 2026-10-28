import clsx from 'clsx'
import { type ElementType, createElement } from 'react'

export default function Card<As extends ElementType = 'div'>({
  as: asElement,
  bleed,
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<As> & {
  as?: As
  /**
   * Edge to edge on small screens, over `Container` padding.
   */
  bleed?: boolean
}) {
  return createElement(
    asElement ?? 'div',
    {
      className: clsx(
        className,
        'overflow-hidden rounded-xl border border-stone-light bg-white dark:border-neutral-800 dark:bg-neutral-900',
        bleed && 'max-sm:-mx-4 max-sm:w-auto max-sm:rounded-none max-sm:border-x-0'
      ),
      ...props,
    },
    children
  )
}

export function ClickableCard<As extends ElementType = 'a'>({
  className,
  as: asElement,
  children,
  ...props
}: React.ComponentPropsWithoutRef<As> & { as?: As; className?: string }) {
  return createElement(
    asElement ?? 'a',
    {
      className: clsx(
        className,
        'overflow-hidden rounded-xl border border-stone-light bg-white transition-colors hover:border-charcoal dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-500',
        'focus-visible:outline-2 focus-visible:outline-solid! focus-visible:outline-offset-2 focus-visible:outline-blue-600'
      ),
      ...props,
    },
    children
  )
}
