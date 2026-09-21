import clsx from 'clsx'
import React from 'react'
import { useImageLoadState } from '~/utils/use_image_load_state'

type AvatarProps = {
  src?: string | null
  square?: boolean
  initials?: string
  alt?: string
  className?: string
}

export function Avatar({
  src = null,
  square = false,
  initials,
  alt = '',
  className,
  ...props
}: AvatarProps & React.ComponentPropsWithoutRef<'span'>) {
  const { imageLoadState, onError, onLoad } = useImageLoadState(src)

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
          onError={onError}
          onLoad={onLoad}
          // Fall back to initials instead of broken image icon.
          style={{ display: imageLoadState === 'error' ? 'none' : 'block' }}
          src={src}
          alt={alt}
        />
      )}
    </span>
  )
}
