import { usePage } from '@inertiajs/react'

export default function BetaWarning() {
  const {
    props: { brand },
  } = usePage()

  if (!brand.feedbackUrl) return null

  return (
    <div className="bg-brand py-2 px-3 text-center text-black/80 font-semibold">
      {brand.name} Portal is currently in beta.{' '}
      <a
        href={brand.feedbackUrl}
        rel="noopener noreferrer"
        target="_blank"
        className="underline hover:text-black/60"
      >
        Give feedback
      </a>
      .
    </div>
  )
}
