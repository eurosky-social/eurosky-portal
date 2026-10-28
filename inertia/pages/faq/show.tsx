import { ArrowDownIcon } from '@heroicons/react/24/solid'
import { Head } from '@inertiajs/react'
import MarkdownDocument from '~/components/MarkdownDocument'
import { PageHeader } from '~/components/PageHeader'
import { InertiaProps } from '~/types'
import { useT } from '~/lib/i18n'

export default function Faq(props: InertiaProps<{ faq: { question: string; answer: string }[] }>) {
  const { tPlain, t } = useT()

  return (
    <>
      <Head title={tPlain('faq.title')} />
      <PageHeader className="mb-8" title={t('faq.title')} />
      {props.faq.map((entry, idx) => (
        <details
          key={idx}
          className="faq border border-stone-light dark:border-neutral-800 rounded-xl mb-4 overflow-hidden hover:border-charcoal dark:hover:border-neutral-600 transition-colors"
        >
          <summary className="flex items-center justify-between relative font-semibold text-ink dark:text-white p-6 cursor-pointer hover:bg-stone-light dark:hover:bg-neutral-900 transition-colors">
            {entry.question}
            <ArrowDownIcon className="w-6 h-6 flex text-charcoal dark:text-neutral-400 transition-transform" />
          </summary>
          <MarkdownDocument
            className="px-6 pt-4 pb-6 text-charcoal! dark:text-neutral-400! leading-relaxed border-stone-light dark:border-neutral-800 border-t"
            document={entry.answer}
          />
        </details>
      ))}
    </>
  )
}
