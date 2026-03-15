import { Link, LinkProps } from '@adonisjs/inertia/react'
import clsx from 'clsx'

export default function Card({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={clsx(
        className,
        'overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10'
      )}
    >
      {props.children}
    </div>
  )
}

export function ClickableCard({
  className,
  children,
  ...props
}: LinkProps & React.ComponentPropsWithRef<'a'>) {
  return (
    <Link
      {...props}
      className={clsx(
        className,
        'overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10',
        'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600 hover:-outline-offset-1 border border-white hover:border-slate-300 hover:shadow-lg'
      )}
    >
      {children}
    </Link>
  )
}
