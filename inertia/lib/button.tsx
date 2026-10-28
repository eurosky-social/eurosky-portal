import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'
import { Link } from './link'
import type { LinkProps } from '@adonisjs/inertia/react'

export const styles = {
  base: [
    // Base
    'relative isolate inline-flex justify-center border font-semibold transition-colors',
    // Focus (the outline itself comes from `:focus-visible` in `app.css`)
    'outline-offset-2',
    // Disabled
    'data-disabled:cursor-default data-disabled:opacity-50',
    // Icon
    '*:data-[slot=icon]:shrink-0 *:data-[slot=icon]:text-(--btn-icon) forced-colors:[--btn-icon:ButtonText] forced-colors:data-hover:[--btn-icon:ButtonText]',
  ],
  // Buttons with text (all but `icon`), pill shaped like on eurosky.tech.
  text: [
    'items-baseline gap-x-2 rounded-full text-base/6 sm:text-sm/6',
    'px-[calc(--spacing(4.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(4)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
    '*:data-[slot=icon]:-mx-0.5 *:data-[slot=icon]:my-0.5 *:data-[slot=icon]:size-5 *:data-[slot=icon]:self-center sm:*:data-[slot=icon]:my-1 sm:*:data-[slot=icon]:size-4',
  ],
  // Square button with only an icon (give it an `aria-label`).
  icon: [
    'size-10 items-center rounded-lg border-transparent *:data-[slot=icon]:size-5',
    'data-active:bg-stone-light data-hover:bg-stone-light dark:data-active:bg-white/10 dark:data-hover:bg-white/10',
    '[--btn-icon:var(--color-charcoal)] data-active:[--btn-icon:var(--color-ink)] data-hover:[--btn-icon:var(--color-ink)] dark:[--btn-icon:var(--color-neutral-400)] dark:data-active:[--btn-icon:var(--color-white)] dark:data-hover:[--btn-icon:var(--color-white)]',
  ],
  link: [
    'p-0! bg-none border-none text-ink font-normal! underline decoration-ink/50 data-hover:decoration-ink data-active:decoration-ink dark:text-white dark:decoration-white/50 dark:data-hover:decoration-white',
  ],
  solid: [
    'border-transparent bg-(--btn-bg) data-active:bg-(--btn-hover-bg) data-hover:bg-(--btn-hover-bg)',
  ],
  outline: [
    // Base
    'border-ink text-ink data-active:bg-ink data-active:text-cotton data-hover:bg-ink data-hover:text-cotton',
    // Dark mode
    'dark:border-white/20 dark:text-white dark:data-active:bg-white/10 dark:data-hover:bg-white/10',
    // Icon
    '[--btn-icon:var(--color-ink)] data-active:[--btn-icon:var(--color-cotton)] data-hover:[--btn-icon:var(--color-cotton)] dark:[--btn-icon:var(--color-white)] dark:data-active:[--btn-icon:var(--color-white)] dark:data-hover:[--btn-icon:var(--color-white)]',
  ],
  colors: {
    // Ink, inverted to white in dark mode like on the site’s ink sections.
    dark: [
      'text-cotton [--btn-bg:var(--color-ink)] [--btn-hover-bg:var(--color-charcoal)]',
      'dark:text-ink dark:[--btn-bg:var(--color-white)] dark:[--btn-hover-bg:var(--color-neutral-200)]',
      '[--btn-icon:var(--color-cotton)] dark:[--btn-icon:var(--color-ink)]',
    ],
  },
}

export type ButtonType = 'button' | 'submit' | 'reset'

type ButtonProps = (
  | { color?: keyof typeof styles.colors; icon?: never; outline?: never; link?: never }
  | { color?: never; icon: true; outline?: never; link?: never }
  | { color?: never; icon?: never; outline: true; link?: never }
  | { color?: never; icon?: never; outline?: never; link: true }
) & { className?: string; children: React.ReactNode } & (
    | ({ href?: never; route?: never; as?: never; type?: ButtonType } & Omit<
        Headless.ButtonProps,
        'as' | 'className'
      >)
    | (LinkProps & Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'> & { as?: never })
    | ({ as: 'a'; href: string; route?: never; type?: never } & Omit<
        React.ComponentPropsWithoutRef<'a'>,
        'className'
      >)
  )

export const Button = forwardRef(function Button(
  { color, icon, outline, link, className, children, type, ...props }: ButtonProps,
  ref: React.ForwardedRef<HTMLElement>
) {
  let classes = clsx(
    styles.base,
    icon ? styles.icon : styles.text,
    icon
      ? undefined
      : outline
        ? styles.outline
        : link
          ? styles.link
          : clsx(styles.solid, styles.colors[color ?? 'dark']),
    className
  )

  let buttonType = (type as ButtonType | undefined) ?? 'button'

  if (props.as === 'a') {
    let { as: _as, ...anchorProps } = props
    return (
      <a {...anchorProps} className={classes} ref={ref as React.ForwardedRef<HTMLAnchorElement>}>
        <TouchTarget>{children}</TouchTarget>
      </a>
    )
  }

  return typeof props.href === 'string' || typeof props.route === 'string' ? (
    <Link {...props} className={classes} ref={ref as React.ForwardedRef<HTMLAnchorElement>}>
      <TouchTarget>{children}</TouchTarget>
    </Link>
  ) : (
    <Headless.Button
      {...props}
      type={buttonType}
      className={clsx(classes, 'cursor-pointer')}
      ref={ref}
    >
      <TouchTarget>{children}</TouchTarget>
    </Headless.Button>
  )
})

/**
 * Expand the hit area to at least 44×44px on touch devices
 */
export function TouchTarget({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span
        className="absolute top-1/2 left-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 pointer-fine:hidden"
        aria-hidden="true"
      />
      {children}
    </>
  )
}
