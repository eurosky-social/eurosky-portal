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

export function ClickableCard({ className, children, ...props }: React.ComponentPropsWithRef<'a'>) {
  return (
    <a
      {...props}
      className={clsx(
        className,
        'overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10',
        'focus-visible:outline-2 focus-visible:outline-solid! focus-visible:outline-offset-2 focus-visible:outline-blue-600 hover:-outline-offset-1 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-lg'
      )}
    >
      {children}
    </a>
  )
}
