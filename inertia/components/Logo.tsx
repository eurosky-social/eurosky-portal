import { usePage } from '@inertiajs/react'

export function Logo(_props: React.ComponentProps<'div'>) {
  const {
    props: { brand },
  } = usePage()

  return (
    <h1 id="logo">
      <span className="invisible">{brand.name}</span>
    </h1>
  )
}
