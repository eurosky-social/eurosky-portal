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
        'overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/5',
        bleed && 'max-sm:-mx-4 max-sm:w-auto max-sm:rounded-none max-sm:shadow-none'
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
        'overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800/20 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10',
        'focus-visible:outline-2 focus-visible:outline-solid! focus-visible:outline-offset-2 focus-visible:outline-blue-600 hover:-outline-offset-1 border border-neutral-300/50 hover:border-neutral-300/70 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/50 hover:shadow-lg'
      ),
      ...props,
    },
    children
  )
}
