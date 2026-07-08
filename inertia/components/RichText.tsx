import { Fragment } from 'react'
import type { Segment } from '#utils/richtext'

export function RichText({ text }: { text: Array<Segment> }) {
  return (
    <div className="whitespace-pre-wrap text-base text-zinc-900 dark:text-white">
      {text.map(({ feature, text }, key) => {
        return feature ? (
          <a className="text-blue-600 dark:text-blue-400" key={key}>
            {text}
          </a>
        ) : (
          <Fragment key={key}>{text}</Fragment>
        )
      })}
    </div>
  )
}
