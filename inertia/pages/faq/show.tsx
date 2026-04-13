import { ArrowDownIcon } from '@heroicons/react/24/solid'
import { Head } from '@inertiajs/react'
import MarkdownDocument from '~/components/MarkdownDocument'
import { Container } from '~/lib/container'
import { InertiaProps } from '~/types'

export default function Faq(props: InertiaProps<{ faq: { question: string; answer: string }[] }>) {
  return (
    <>
      <Head title="Frequently Asked Questions" />
      <Container className="py-16 md:py-24 px-4">
        <h1 className="mb-6 text-4xl md:text-5xl text-black dark:text-slate-200 font-semibold text-center">
          Frequently Asked Questions
        </h1>
      </Container>
      <div className="bg-neutral-50 dark:bg-slate-800 min-h-dvh-minus-35">
        <Container className="pt-5 pb-10 md:pb-24 md:pt-12 faq">
          <h2 className="text-2xl font-semibold text-ink dark:text-white mb-8">Eurosky Portal</h2>
          {props.faq.map((entry, idx) => (
            <details
              key={idx}
              className="border border-charcoal/20 dark:border-slate-700 rounded-lg mb-4 overflow-hidden hover:border-charcoal dark:hover:border-slate-600 transition-colors"
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
        </Container>
      </div>
    </>
  )
}
