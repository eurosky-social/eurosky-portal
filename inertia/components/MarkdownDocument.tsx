import clsx from 'clsx'

export default function MarkdownDocument({
  document,
  className,
}: { document: string } & React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={clsx('markdown-document dark:text-slate-200 text-charcoal', className)}
      dangerouslySetInnerHTML={{ __html: document }}
    />
  )
}
