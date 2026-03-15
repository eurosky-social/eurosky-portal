import clsx from 'clsx'

export default function Card({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={clsx(
        className,
        'overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10'
      )}
    >
      <div className="px-4 py-4">{props.children}</div>
    </div>
  )
}
