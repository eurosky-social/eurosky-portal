import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { ReactNode } from 'react'

type NoticeProps = {
  action?: ReactNode
  text: ReactNode
  title: string
}

export default function Notice({ action, text, title }: NoticeProps) {
  return (
    <div className="rounded-xl border border-stone-light bg-white p-4 my-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex">
        <div className="shrink-0">
          <ExclamationTriangleIcon
            aria-hidden="true"
            className="size-5 text-charcoal dark:text-neutral-400"
          />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-semibold text-ink dark:text-white">{title}</h3>
          <div className="mt-1 text-sm text-charcoal dark:text-neutral-400">
            <p>{text}</p>
          </div>
          {action && (
            <div className="mt-2 text-sm font-medium text-ink dark:text-white">{action}</div>
          )}
        </div>
      </div>
    </div>
  )
}
