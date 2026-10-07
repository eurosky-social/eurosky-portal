import { brand } from '#shared/brand'

export function Logo(_props: React.ComponentProps<'div'>) {
  return (
    <h1 id="logo">
      <span className="invisible">{brand.orgName}</span>
    </h1>
  )
}
