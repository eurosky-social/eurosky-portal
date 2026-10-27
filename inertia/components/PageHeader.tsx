import type { ReactNode } from 'react'

interface Properties {
  /**
   * Class name.
   */
  className?: string

  /**
   * Description below the title.
   */
  description?: ReactNode

  /**
   * Whether changes to the description are announced (such as while syncing).
   */
  live?: boolean

  /**
   * Title of the page.
   */
  title: ReactNode
}

/**
 * Title (`h1`) and description of a page.
 */
export function PageHeader(properties: Properties) {
  const { className, description, live, title } = properties

  return (
    <header className={className}>
      <h1 className="text-2xl/8 font-semibold text-zinc-950 sm:text-3xl/9 dark:text-white">
        {title}
      </h1>
      {description ? (
        <p
          aria-live={live ? 'polite' : undefined}
          className="mt-2 text-zinc-500 dark:text-slate-400"
          role={live ? 'status' : undefined}
        >
          {description}
        </p>
      ) : undefined}
    </header>
  )
}
