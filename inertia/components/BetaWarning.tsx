export default function BetaWarning() {
  return (
    <div className="bg-brand py-2 px-3 text-center text-black/80 font-semibold">
      Eurosky Portal is currently in beta.{' '}
      <a
        href="https://eurosky.tech/blog/eurosky-portal-beta/"
        className="underline hover:text-black/60"
      >
        Learn more
      </a>
      .
    </div>
  )
}
