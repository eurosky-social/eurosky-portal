import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'
import { Link } from './link'
import type { LinkProps } from '@adonisjs/inertia/react'

export const styles = {
  base: [
    // Base
    'relative isolate inline-flex justify-center rounded-lg border font-semibold',
    // Focus (the outline itself comes from `:focus-visible` in `app.css`)
    'outline-offset-2',
    // Disabled
    'data-disabled:cursor-default data-disabled:opacity-50',
    // Icon
    '*:data-[slot=icon]:shrink-0 *:data-[slot=icon]:text-(--btn-icon) forced-colors:[--btn-icon:ButtonText] forced-colors:data-hover:[--btn-icon:ButtonText]',
  ],
  // Buttons with text (all but `icon`).
  text: [
    'items-baseline gap-x-2 text-base/6 sm:text-sm/6',
    'px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
    '*:data-[slot=icon]:-mx-0.5 *:data-[slot=icon]:my-0.5 *:data-[slot=icon]:size-5 *:data-[slot=icon]:self-center sm:*:data-[slot=icon]:my-1 sm:*:data-[slot=icon]:size-4',
  ],
  // Square button with only an icon (give it an `aria-label`).
  icon: [
    'size-10 items-center border-transparent *:data-[slot=icon]:size-5',
    'data-active:bg-zinc-950/5 data-hover:bg-zinc-950/5 dark:data-active:bg-white/10 dark:data-hover:bg-white/10',
    '[--btn-icon:var(--color-zinc-500)] data-active:[--btn-icon:var(--color-zinc-700)] data-hover:[--btn-icon:var(--color-zinc-700)] dark:[--btn-icon:var(--color-slate-400)] dark:data-active:[--btn-icon:var(--color-white)] dark:data-hover:[--btn-icon:var(--color-white)]',
  ],
  link: [
    'p-0! bg-none border-none text-blue-600 font-normal! data-hover:underline data-active:underline dark:text-blue-400',
  ],
  solid: [
    // Optical border, implemented as the button background to avoid corner artifacts
    'border-transparent bg-(--btn-border)',
    // Dark mode: border is rendered on `after` so background is set to button background
    'dark:bg-(--btn-bg)',
    // Button background, implemented as foreground layer to stack on top of pseudo-border layer
    'before:absolute before:inset-0 before:-z-10 before:rounded-[calc(var(--radius-lg)-1px)] before:bg-(--btn-bg)',
    // Drop shadow, applied to the inset `before` layer so it blends with the border
    'before:shadow-sm',
    // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
    'dark:before:hidden',
    // Dark mode: Subtle white outline is applied using a border
    'dark:border-white/5',
    // Shim/overlay, inset to match button foreground and used for hover state + highlight shadow
    'after:absolute after:inset-0 after:-z-10 after:rounded-[calc(var(--radius-lg)-1px)]',
    // Inner highlight shadow
    'after:shadow-[inset_0_1px_--theme(--color-white/15%)]',
    // White overlay on hover
    'data-active:after:bg-(--btn-hover-overlay) data-hover:after:bg-(--btn-hover-overlay)',
    // Dark mode: `after` layer expands to cover entire button
    'dark:after:-inset-px dark:after:rounded-lg',
    // Disabled
    'data-disabled:before:shadow-none data-disabled:after:shadow-none',
  ],
  outline: [
    // Base
    'border-zinc-950/10 text-zinc-950 data-active:bg-zinc-950/2.5 data-hover:bg-zinc-950/2.5',
    // Dark mode
    'dark:border-white/15 dark:text-white dark:[--btn-bg:transparent] dark:data-active:bg-white/5 dark:data-hover:bg-white/5',
    // Icon
    '[--btn-icon:var(--color-zinc-500)] data-active:[--btn-icon:var(--color-zinc-700)] data-hover:[--btn-icon:var(--color-zinc-700)] dark:data-active:[--btn-icon:var(--color-zinc-400)] dark:data-hover:[--btn-icon:var(--color-zinc-400)]',
  ],
  colors: {
    dark: [
      'text-white [--btn-bg:var(--color-zinc-900)] [--btn-border:var(--color-zinc-950)]/90 [--btn-hover-overlay:var(--color-white)]/10',
      'dark:[--btn-bg:var(--color-slate-700)] dark:[--btn-hover-overlay:var(--color-white)]/5',
      '[--btn-icon:var(--color-zinc-400)] data-active:[--btn-icon:var(--color-zinc-300)] data-hover:[--btn-icon:var(--color-zinc-300)]',
    ],
    // Main action on a page, such as signing in.
    brand: [
      'text-black/80 [--btn-hover-overlay:var(--color-black)]/10 [--btn-bg:var(--color-brand)] [--btn-border:var(--color-brand-border)]/60',
      '[--btn-icon:var(--color-black)]/60',
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
