import { Head } from '@inertiajs/react'
import type { Root } from 'hast'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import type { Jsonify } from '#shared/json'
import Card from '~/lib/card'
import { Container } from '~/lib/container'
import { InertiaProps } from '~/types'

export default function Legal(props: InertiaProps<{ document: Jsonify<Root>; title: string }>) {
  return (
    <div className="bg-neutral-50 dark:bg-slate-900 py-10 md:pt-24">
      <Head title={props.title} />
      <Container>
        <Card bleed className="w-full md:w-3/4 m-auto p-4">
          <div className="markdown-document dark:text-slate-200 text-grey-800" lang="en">
            {toJsxRuntime(props.document, { Fragment, jsx, jsxs })}
          </div>
        </Card>
      </Container>
    </div>
  )
}
