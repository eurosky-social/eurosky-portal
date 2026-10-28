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
      <h1 className="text-3xl/9 font-bold tracking-tight text-balance text-ink sm:text-4xl/11 dark:text-white">
        {title}
      </h1>
      {description ? (
        <p
          aria-live={live ? 'polite' : undefined}
          className="mt-2 text-neutral-500 dark:text-neutral-400"
          role={live ? 'status' : undefined}
        >
          {description}
        </p>
      ) : undefined}
    </header>
  )
}
