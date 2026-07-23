const feedbackUrl = 'https://userinput.app/#/s/did:plc:ooensn4mr5mhznzypvxelfa3/3mr5gmbhteg2p'

export default function BetaWarning() {
  return (
    <div className="bg-brand py-2 px-3 text-center text-black/80 font-semibold">
      Eurosky Portal is currently in beta.{' '}
      <a
        href={feedbackUrl}
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
