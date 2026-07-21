import { useState } from 'react'

/**
 * Whether the image has loaded, is loading, or encountered an error.
 */
export type ImageLoadState = 'error' | 'loaded' | 'loading'

/**
 * Track `<img>` load state.
 *
 * @param src
 *   URL.
 * @return
 *   `imageLoadState` and two callbacks for `onError` and `onLoad`.
 */
export function useImageLoadState(src: string | null | undefined) {
  const [imageLoadState, setImageLoadState] = useState<ImageLoadState>('loading')
  const [prevSrc, setPrevSrc] = useState(src)

  if (src !== prevSrc) {
    setImageLoadState('loading')
    setPrevSrc(src)
  }

  return {
    imageLoadState,
    onError(): undefined {
      setImageLoadState('error')
    },
    onLoad(): undefined {
      setImageLoadState('loaded')
    },
  }
}
