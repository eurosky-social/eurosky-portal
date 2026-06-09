import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef, useEffect, useState } from 'react'
import { ButtonType, TouchTarget } from './button'
import { Link } from './link'
import { LinkProps } from '@adonisjs/inertia/react'

type AvatarProps = {
  src?: string | null
  square?: boolean
  initials?: string
  alt?: string
  className?: string
}

/**
 * State of an image.
 */
type ImageLoadState = 'error' | 'loaded' | 'loading'

export function Avatar({
  src = null,
  square = false,
  initials,
  alt = '',
  className,
  ...props
}: AvatarProps & React.ComponentPropsWithoutRef<'span'>) {
  const [imageLoadState, setImageLoadState] = useState<ImageLoadState>('loading')

  useEffect(() => {
    setImageLoadState('loading')
  }, [src])

  return (
    <span
      data-slot="avatar"
      {...props}
      className={clsx(
        className,
        // Basic layout
        'inline-grid shrink-0 align-middle [--avatar-radius:20%] *:col-start-1 *:row-start-1',
        'outline -outline-offset-1 outline-black/10 dark:outline-white/10',
        // Border radius
        square
          ? 'rounded-(--avatar-radius) *:rounded-(--avatar-radius)'
          : 'rounded-full *:rounded-full'
      )}
    >
      <svg
        className="size-full fill-current p-[5%] text-[48px] font-medium uppercase select-none"
        viewBox="0 0 100 100"
        aria-hidden={alt ? undefined : 'true'}
        // For transparent images, hide initials when the image is loaded.
        style={{ display: imageLoadState === 'loaded' ? 'none' : 'block' }}
      >
        {alt && <title>{alt}</title>}
        <text
          x="50%"
          y="50%"
          alignmentBaseline="middle"
          dominantBaseline="middle"
          textAnchor="middle"
          dy={initials ? '.125em' : undefined}
        >
          {initials || '@'}
        </text>
      </svg>
      {src && (
        <img
          className="size-full"
          onError={() => setImageLoadState('error')}
          onLoad={() => setImageLoadState('loaded')}
          // Fall back to initials instead of broken image icon.
          style={{ display: imageLoadState === 'error' ? 'none' : 'block' }}
          src={src}
          alt={alt}
        />
      )}
    </span>
  )
}

export const AvatarButton = forwardRef(function AvatarButton(
  {
    src,
    square = false,
    initials,
    alt,
    className,
    type,
    ...props
  }: AvatarProps &
    (
      | ({ href?: never; route?: never } & Omit<Headless.ButtonProps, 'as' | 'className'>)
      | (LinkProps & Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>)
    ),
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  let classes = clsx(
    className,
    square ? 'rounded-[20%]' : 'rounded-full',
    'relative inline-grid focus:not-data-focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500'
  )

  let buttonType = (type as ButtonType) ?? ('button' as ButtonType)

  return typeof props.href === 'string' || typeof props.route === 'string' ? (
    <Link {...props} className={classes} ref={ref as React.ForwardedRef<HTMLAnchorElement>}>
      <TouchTarget>
        <Avatar src={src} square={square} initials={initials} alt={alt} />
      </TouchTarget>
    </Link>
  ) : (
    <Headless.Button {...props} type={buttonType} className={classes} ref={ref}>
      <TouchTarget>
        <Avatar src={src} square={square} initials={initials} alt={alt} />
      </TouchTarget>
    </Headless.Button>
  )
})
