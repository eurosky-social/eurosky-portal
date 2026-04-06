import clsx from 'clsx'
import { JSXElementConstructor, createElement } from 'react'
export type ReactTag = keyof React.JSX.IntrinsicElements | JSXElementConstructor<any>

export default function Card<TTag extends ReactTag = 'div'>({
  className,
  as: asElement,
  children,
  ...props
}: React.ComponentPropsWithoutRef<TTag> & { as?: TTag }) {
  return createElement(
    asElement ?? 'div',
    {
      className: clsx(
        className,
        'overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/5'
      ),
      ...props,
    },
    children
  )
}

export function ClickableCard({ className, children, ...props }: React.ComponentPropsWithRef<'a'>) {
  return (
    <a
      {...props}
      className={clsx(
        className,
        'overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800/20 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10',
        'focus-visible:outline-2 focus-visible:outline-solid! focus-visible:outline-offset-2 focus-visible:outline-blue-600 hover:-outline-offset-1 border border-neutral-300/50 hover:border-neutral-300/70 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/50 hover:shadow-lg'
      )}
    >
      {children}
    </a>
  )
}
