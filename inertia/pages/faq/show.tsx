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
          className="faq border border-charcoal/20 dark:border-slate-700 rounded-lg mb-4 overflow-hidden hover:border-charcoal dark:hover:border-slate-600 transition-colors"
        >
          <summary className="flex items-center justify-between relative font-semibold text-ink/80 dark:text-slate-300 p-6 cursor-pointer bg-stone/60 hover:bg-stone-light  dark:bg-slate-900/50  dark:hover:bg-slate-900 transition-colors">
            {entry.question}
            <ArrowDownIcon className="w-6 h-6 flex text-charcoal dark:text-slate-400 transition-transform" />
          </summary>
          <MarkdownDocument
            className="p-4 bg-white text-charcoal! dark:text-slate-400! leading-relaxed dark:bg-slate-800 border-stone-light dark:border-slate-700 border-t"
            document={entry.answer}
          />
        </details>
      ))}
    </>
  )
}
