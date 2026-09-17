import clsx from 'clsx'

export default function MarkdownDocument({
  document,
  className,
}: { document: string } & React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      // Not yet translated unlike surrounding UI so mark as English.
      lang="en"
      className={clsx('markdown-document dark:text-slate-200 text-grey-800', className)}
      dangerouslySetInnerHTML={{ __html: document }}
    />
  )
}
